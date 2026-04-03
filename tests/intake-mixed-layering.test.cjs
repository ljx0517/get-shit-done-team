/**
 * GSD Tools Tests - Intake mixed layering
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

function writeJson(tmpDir, filename, data) {
  const fullPath = path.join(tmpDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  return fullPath;
}

describe('intake mixed layering', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) cleanup(tmpDir);
  });

  test('merge accepts AI resolution file and updates canonical unit by id', () => {
    tmpDir = createTempDir();

    const raw1 = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'first input'], tmpDir).output);
    const units1Path = writeJson(tmpDir, 'units1.json', {
      units: [
        {
          type: 'preference',
          summary: 'Keep the flow low-friction',
          confidence: 0.81,
        },
      ],
    });
    const merge1 = runGsdTools(['intake', 'merge', '--raw-id', raw1.raw_id, '--units-file', units1Path], tmpDir);
    assert.ok(merge1.success, `merge1 failed: ${merge1.error}`);
    const firstLedger = JSON.parse(merge1.output).ledger;
    const existingId = firstLedger.units[0].id;

    const raw2 = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'second input'], tmpDir).output);
    const resolutionPath = writeJson(tmpDir, 'resolution.json', {
      canonical_units: [
        {
          id: existingId,
          type: 'preference',
          summary: 'Keep the flow low-friction',
          confidence: 0.96,
          status: 'mature',
        },
      ],
      duplicates: [
        {
          matches_unit_id: existingId,
          confidence: 0.91,
          reason: 'Semantic duplicate of existing preference',
        },
      ],
      conflicts: [],
    });

    const merge2 = runGsdTools(['intake', 'merge', '--raw-id', raw2.raw_id, '--resolution-file', resolutionPath], tmpDir);
    assert.ok(merge2.success, `merge2 failed: ${merge2.error}`);
    const output = JSON.parse(merge2.output);

    assert.strictEqual(output.ledger.unit_count, 1);
    assert.strictEqual(output.ledger.units[0].id, existingId);
    assert.strictEqual(output.ledger.units[0].status, 'mature');
    assert.strictEqual(output.ledger.units[0].evidence.length, 2);
  });

  test('decide accepts AI assessment file but still applies deterministic existing-plan guard', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: true });

    const raw = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'phase 2 refinement'], tmpDir).output);
    const unitsPath = writeJson(tmpDir, 'phase2-units.json', {
      units: [
        {
          type: 'user_story',
          summary: 'User can log in with email and password',
          actor: 'User',
          need: 'Log in with email and password',
          value: 'Access the application securely',
          confidence: 0.95,
          phase_hint: { phase: 2, confidence: 0.95, reason: 'Matches authentication phase goal' },
        },
      ],
    });
    const merge = runGsdTools(['intake', 'merge', '--raw-id', raw.raw_id, '--units-file', unitsPath], tmpDir);
    assert.ok(merge.success, `merge failed: ${merge.error}`);

    const assessmentPath = writeJson(tmpDir, 'assessment.json', {
      recommended_action: 'trigger_plan_phase_prd',
      mode: 'initialized_project',
      target_phase: '2',
      target_phase_confidence: 0.97,
      project_ready_score: 0.52,
      phase_ready_score: 0.91,
      one_line_status: '已收纳 | phase=2 conf=0.97 | next=trigger_plan_phase_prd',
      why: ['AI judged phase 2 ready for planning'],
    });

    const decide = runGsdTools(['intake', 'decide', '--assessment-file', assessmentPath], tmpDir);
    assert.ok(decide.success, `decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.strictEqual(output.target_phase, '2');
    assert.strictEqual(output.has_existing_plans, true);
    assert.strictEqual(output.next_action, 'idle');
    assert.ok(output.one_line_status.includes('existing-plans=yes'));
  });

  test('materialize accepts AI artifacts file and writes provided markdown while returning dispatch boundary', () => {
    tmpDir = createTempProject();
    setupInitializedProject(tmpDir, { phase2HasPlan: false });

    const raw = JSON.parse(runGsdTools(['intake', 'save-raw', '--text', 'phase 2 refinement'], tmpDir).output);
    const unitsPath = writeJson(tmpDir, 'phase2-ready-units.json', {
      units: [
        {
          type: 'user_story',
          summary: 'User can log in with email and password',
          actor: 'User',
          need: 'Log in with email and password',
          value: 'Access the application securely',
          confidence: 0.95,
          phase_hint: { phase: 2, confidence: 0.95, reason: 'Matches authentication phase goal' },
        },
      ],
    });
    const merge = runGsdTools(['intake', 'merge', '--raw-id', raw.raw_id, '--units-file', unitsPath], tmpDir);
    assert.ok(merge.success, `merge failed: ${merge.error}`);

    const assessmentPath = writeJson(tmpDir, 'assessment-ready.json', {
      recommended_action: 'trigger_plan_phase_prd',
      mode: 'initialized_project',
      target_phase: '2',
      target_phase_confidence: 0.94,
      project_ready_score: 0.53,
      phase_ready_score: 0.88,
      one_line_status: '已收纳 | phase=2 conf=0.94 | next=trigger_plan_phase_prd',
      why: ['AI judged phase 2 ready for planning'],
    });
    const decide = runGsdTools(['intake', 'decide', '--assessment-file', assessmentPath], tmpDir);
    assert.ok(decide.success, `decide failed: ${decide.error}`);

    const artifactsPath = writeJson(tmpDir, 'artifacts.json', {
      cards_markdown: '# AI Cards\n\n- card from AI\n',
      project_brief_markdown: '# AI Project Brief\n\nproject brief from AI\n',
      phase_brief_markdown: '# AI Phase Brief\n\nphase brief from AI\n',
      one_line_status: '已收纳 | phase=2 conf=0.94 | next=trigger_plan_phase_prd',
    });

    const materialize = runGsdTools(['intake', 'materialize', '--artifacts-file', artifactsPath], tmpDir);
    assert.ok(materialize.success, `materialize failed: ${materialize.error}`);
    const output = JSON.parse(materialize.output);

    assert.strictEqual(output.dispatch_command, '/gsdt:plan-phase 2 --prd .claude/.gsdt-planning/phases/02-authentication/02-INTAKE.md');
    assert.strictEqual(fs.readFileSync(output.cards_path, 'utf8'), '# AI Cards\n\n- card from AI\n');
    assert.strictEqual(fs.readFileSync(output.phase_brief_path, 'utf8'), '# AI Phase Brief\n\nphase brief from AI\n');
  });
});
