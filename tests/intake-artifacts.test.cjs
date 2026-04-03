/**
 * GSD Tools Tests - Intake rendered artifacts
 */
const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempDir, createTempProject, cleanup } = require('./helpers.cjs');

function writeRoadmap(tmpDir, content) {
  const roadmapPath = path.join(tmpDir, '.claude/.gsdt-planning', 'ROADMAP.md');
  fs.mkdirSync(path.dirname(roadmapPath), { recursive: true });
  fs.writeFileSync(roadmapPath, content, 'utf8');
}

function writeUnitsFile(tmpDir, filename, units) {
  const fullPath = path.join(tmpDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify({ units }, null, 2), 'utf8');
  return fullPath;
}

function setupInitializedProject(tmpDir, { phase2HasPlan = false } = {}) {
  writeRoadmap(tmpDir, `# Roadmap

## Phase 1: Foundation
**Goal:** Set up project skeleton and state management

## Phase 2: Authentication
**Goal:** Implement user login, logout, and session persistence

## Phase 3: Sharing
**Goal:** Allow users to share generated requirement briefs
`);

  const phasesDir = path.join(tmpDir, '.claude/.gsdt-planning', 'phases');
  const phase1 = path.join(phasesDir, '01-foundation');
  const phase2 = path.join(phasesDir, '02-authentication');
  const phase3 = path.join(phasesDir, '03-sharing');
  fs.mkdirSync(phase1, { recursive: true });
  fs.mkdirSync(phase2, { recursive: true });
  fs.mkdirSync(phase3, { recursive: true });

  fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan 1\n', 'utf8');
  fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary 1\n', 'utf8');

  if (phase2HasPlan) {
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan 2\n', 'utf8');
  }
}

function mergeUnits(tmpDir, text, filename, units) {
  const raw = runGsdTools(['intake', 'save-raw', '--text', text], tmpDir);
  assert.ok(raw.success, `save-raw failed: ${raw.error}`);
  const rawOut = JSON.parse(raw.output);
  const unitsFile = writeUnitsFile(tmpDir, filename, units);
  const merge = runGsdTools(['intake', 'merge', '--raw-id', rawOut.raw_id, '--units-file', unitsFile], tmpDir);
  assert.ok(merge.success, `merge failed: ${merge.error}`);
  return rawOut;
}

describe('intake rendered artifacts', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) cleanup(tmpDir);
  });

  test('render writes cards markdown grouped by semantic type', () => {
    tmpDir = createTempDir();
    mergeUnits(tmpDir, 'render cards', 'render-units.json', [
      {
        type: 'user_story',
        summary: 'User can turn rough ideas into a project brief',
        actor: 'User',
        need: 'Capture freeform thoughts',
        value: 'Avoid writing a full PRD first',
        confidence: 0.94,
      },
      {
        type: 'constraint',
        summary: 'Do not force the user into a long questionnaire',
        confidence: 0.87,
      },
      {
        type: 'open_question',
        summary: 'Should the brief highlight unresolved conflicts explicitly?',
        confidence: 0.72,
      },
    ]);

    const render = runGsdTools(['intake', 'render'], tmpDir);
    assert.ok(render.success, `render failed: ${render.error}`);
    const output = JSON.parse(render.output);

    assert.strictEqual(output.rendered, true);
    assert.ok(fs.existsSync(output.cards_path), 'cards.md should be written');

    const cards = fs.readFileSync(output.cards_path, 'utf8');
    assert.ok(cards.includes('## User Stories'));
    assert.ok(cards.includes('## Constraints'));
    assert.ok(cards.includes('## Open Questions'));
    assert.ok(cards.includes('User can turn rough ideas into a project brief'));
    assert.ok(cards.includes('Do not force the user into a long questionnaire'));
  });

  test('materialize writes project brief for cold-start readiness', () => {
    tmpDir = createTempDir();
    mergeUnits(tmpDir, 'cold start brief', 'project-brief-units.json', [
      {
        type: 'user_story',
        summary: 'Developer can start planning from one sentence',
        actor: 'Developer',
        need: 'Describe an idea in natural language',
        value: 'Reduce startup friction',
        confidence: 0.95,
      },
      {
        type: 'user_story',
        summary: 'User can turn rough ideas into a project brief',
        actor: 'User',
        need: 'Capture freeform thoughts',
        value: 'Avoid writing a full PRD first',
        confidence: 0.94,
      },
      {
        type: 'preference',
        summary: 'Keep the interaction low-friction',
        confidence: 0.87,
      },
    ]);

    const materialize = runGsdTools(['intake', 'materialize'], tmpDir);
    assert.ok(materialize.success, `materialize failed: ${materialize.error}`);
    const output = JSON.parse(materialize.output);

    assert.strictEqual(output.next_action, 'trigger_new_project');
    assert.strictEqual(output.project_brief_written, true);
    assert.ok(fs.existsSync(output.project_brief_path), 'brief.md should exist');
    assert.strictEqual(output.dispatch_command, '/gsdt:new-project --auto @.claude/.gsdt-intake/brief.md');

    const brief = fs.readFileSync(output.project_brief_path, 'utf8');
    assert.ok(brief.includes('# Intake Brief'));
    assert.ok(brief.includes('## User Story Candidates'));
    assert.ok(brief.includes('Developer can start planning from one sentence'));
    assert.ok(brief.includes('Keep the interaction low-friction'));
  });

  test('materialize writes phase brief while preserving existing-plan guard', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: true });
    mergeUnits(tmpDir, 'phase 2 refinement', 'phase-brief-units.json', [
      {
        type: 'user_story',
        summary: 'User can log in with email and password',
        actor: 'User',
        need: 'Log in with email and password',
        value: 'Access the application securely',
        confidence: 0.95,
        phase_hint: { phase: 2, confidence: 0.95, reason: 'Matches authentication phase goal' },
      },
      {
        type: 'constraint',
        summary: 'Do not add social login in this phase',
        confidence: 0.87,
        phase_hint: { phase: 2, confidence: 0.92, reason: 'Explicit scope for phase 2' },
      },
    ]);

    const materialize = runGsdTools(['intake', 'materialize'], tmpDir);
    assert.ok(materialize.success, `materialize failed: ${materialize.error}`);
    const output = JSON.parse(materialize.output);

    assert.strictEqual(output.next_action, 'idle');
    assert.strictEqual(output.phase_brief_written, true);
    assert.strictEqual(output.target_phase, '2');
    assert.strictEqual(output.dispatch_command, null);
    assert.ok(fs.existsSync(output.phase_brief_path), 'phase brief should exist');

    const phaseBrief = fs.readFileSync(output.phase_brief_path, 'utf8');
    assert.ok(phaseBrief.includes('# Phase 2 Intake Brief'));
    assert.ok(phaseBrief.includes('User can log in with email and password'));
    assert.ok(phaseBrief.includes('Do not add social login in this phase'));
  });

  test('materialize returns plan-phase dispatch command when target phase is ready and has no plans', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: false });
    mergeUnits(tmpDir, 'phase 2 refinement', 'phase-brief-ready-units.json', [
      {
        type: 'user_story',
        summary: 'User can log in with email and password',
        actor: 'User',
        need: 'Log in with email and password',
        value: 'Access the application securely',
        confidence: 0.95,
        phase_hint: { phase: 2, confidence: 0.95, reason: 'Matches authentication phase goal' },
      },
      {
        type: 'constraint',
        summary: 'Do not add social login in this phase',
        confidence: 0.87,
        phase_hint: { phase: 2, confidence: 0.92, reason: 'Explicit scope for phase 2' },
      },
      {
        type: 'preference',
        summary: 'Keep authentication flow low-friction',
        confidence: 0.82,
        phase_hint: { phase: 2, confidence: 0.81, reason: 'Applies to authentication UX' },
      },
    ]);

    const materialize = runGsdTools(['intake', 'materialize'], tmpDir);
    assert.ok(materialize.success, `materialize failed: ${materialize.error}`);
    const output = JSON.parse(materialize.output);

    assert.strictEqual(output.next_action, 'trigger_plan_phase_prd');
    assert.strictEqual(output.target_phase, '2');
    assert.ok(output.phase_brief_path.endsWith(path.join('02-authentication', '02-INTAKE.md')));
    assert.strictEqual(output.dispatch_command, '/gsdt:plan-phase 2 --prd .claude/.gsdt-planning/phases/02-authentication/02-INTAKE.md');
  });
});
