/**
 * GSD Tools Tests - Intake CLI
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempDir, createTempProject, cleanup } = require('./helpers.cjs');

function writeRoadmap(tmpDir, content) {
  const roadmapPath = path.join(tmpDir, '.gsdt-planning', 'ROADMAP.md');
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

  const phasesDir = path.join(tmpDir, '.gsdt-planning', 'phases');
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

describe('intake state', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) cleanup(tmpDir);
  });

  test('creates intake root on cold start', () => {
    tmpDir = createTempDir();
    const result = runGsdTools(['intake', 'state'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);

    assert.strictEqual(output.project_exists, false);
    assert.strictEqual(output.roadmap_exists, false);
    assert.ok(output.intake_root.endsWith(path.join('.claude', '.gsdt-intake')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', '.gsdt-intake')), 'intake root should be created');
  });

  test('returns planning snapshot for initialized project', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: false });

    const result = runGsdTools(['intake', 'state'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);

    assert.strictEqual(output.project_exists, true);
    assert.strictEqual(output.roadmap_exists, true);
    assert.strictEqual(output.active_phase, 2);
    assert.strictEqual(output.existing_plans_by_phase['1'], true);
    assert.strictEqual(output.existing_plans_by_phase['2'], false);
    assert.strictEqual(output.phase_statuses['1'], 'complete');
  });
});

describe('intake save-raw', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('persists raw input verbatim', () => {
    const text = '我想要一个低打扰的 intake 入口\n第二行也要保留';
    const result = runGsdTools(['intake', 'save-raw', '--text', text], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);

    assert.ok(output.raw_id);
    assert.ok(fs.existsSync(output.raw_path), 'raw file should exist');
    const fileContent = fs.readFileSync(output.raw_path, 'utf8');
    assert.ok(fileContent.includes(text), 'raw text should be preserved verbatim');
  });
});

describe('intake merge and decide', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) cleanup(tmpDir);
  });

  test('merges duplicate units and reinforces status', () => {
    tmpDir = createTempDir();

    const raw1 = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'first input'], tmpDir).output);
    const units1Path = writeUnitsFile(tmpDir, 'units1.json', [
      {
        type: 'preference',
        summary: 'Keep the flow low-friction',
        confidence: 0.81,
      },
    ]);
    const merge1 = runGsdTools(['intake', 'merge', '--raw-id', raw1.raw_id, '--units-file', units1Path], tmpDir);
    assert.ok(merge1.success, `Merge 1 failed: ${merge1.error}`);

    const raw2 = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'second input'], tmpDir).output);
    const units2Path = writeUnitsFile(tmpDir, 'units2.json', [
      {
        type: 'preference',
        summary: 'Keep the flow low-friction',
        confidence: 0.88,
      },
    ]);
    const merge2 = runGsdTools(['intake', 'merge', '--raw-id', raw2.raw_id, '--units-file', units2Path], tmpDir);
    assert.ok(merge2.success, `Merge 2 failed: ${merge2.error}`);
    const output = JSON.parse(merge2.output);

    assert.strictEqual(output.ledger.unit_count, 1, 'duplicate preference should merge into one unit');
    assert.strictEqual(output.ledger.units[0].status, 'reinforced');
    assert.strictEqual(output.ledger.units[0].evidence.length, 2);
  });

  test('cold start can trigger new-project from semantic readiness', () => {
    tmpDir = createTempDir();

    const raw = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'cold start idea'], tmpDir).output);
    const unitsPath = writeUnitsFile(tmpDir, 'cold-start-units.json', [
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
    const merge = runGsdTools(['intake', 'merge', '--raw-id', raw.raw_id, '--units-file', unitsPath], tmpDir);
    assert.ok(merge.success, `Merge failed: ${merge.error}`);

    const decide = runGsdTools(['intake', 'decide'], tmpDir);
    assert.ok(decide.success, `Decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.strictEqual(output.mode, 'cold_start');
    assert.strictEqual(output.next_action, 'trigger_new_project');
    assert.ok(output.one_line_status.includes('next=trigger_new_project'));
  });

  test('initialized project can route to plan-phase PRD when phase confidence is high and no plans exist', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: false });

    const raw = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'phase 2 auth refinement'], tmpDir).output);
    const unitsPath = writeUnitsFile(tmpDir, 'phase2-units.json', [
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
    const merge = runGsdTools(['intake', 'merge', '--raw-id', raw.raw_id, '--units-file', unitsPath], tmpDir);
    assert.ok(merge.success, `Merge failed: ${merge.error}`);

    const decide = runGsdTools(['intake', 'decide'], tmpDir);
    assert.ok(decide.success, `Decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.strictEqual(output.mode, 'initialized_project');
    assert.strictEqual(output.target_phase, '2');
    assert.strictEqual(output.has_existing_plans, false);
    assert.strictEqual(output.next_action, 'trigger_plan_phase_prd');
    assert.ok(output.one_line_status.includes('phase=2'));
  });

  test('initialized project stays idle when target phase already has plans', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: true });

    const raw = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'phase 2 auth refinement'], tmpDir).output);
    const unitsPath = writeUnitsFile(tmpDir, 'phase2-planned-units.json', [
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
    const merge = runGsdTools(['intake', 'merge', '--raw-id', raw.raw_id, '--units-file', unitsPath], tmpDir);
    assert.ok(merge.success, `Merge failed: ${merge.error}`);

    const decide = runGsdTools(['intake', 'decide'], tmpDir);
    assert.ok(decide.success, `Decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.strictEqual(output.target_phase, '2');
    assert.strictEqual(output.has_existing_plans, true);
    assert.strictEqual(output.next_action, 'idle');
    assert.ok(output.one_line_status.includes('existing-plans=yes'));
  });
});
