/**
 * GSD Tools Tests - Intake schema shapes
 */
const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempDir, cleanup } = require('./helpers.cjs');

function writeUnitsFile(tmpDir, filename, units) {
  const fullPath = path.join(tmpDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify({ units }, null, 2), 'utf8');
  return fullPath;
}

describe('intake schema shapes', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) cleanup(tmpDir);
  });

  test('ledger output preserves expected unit fields after merge', () => {
    tmpDir = createTempDir();

    const raw = runGsdTools(['intake', 'save-raw', '--text', 'schema test'], tmpDir);
    assert.ok(raw.success, `save-raw failed: ${raw.error}`);
    const rawOut = JSON.parse(raw.output);

    const unitsFile = writeUnitsFile(tmpDir, 'schema-units.json', [
      {
        type: 'user_story',
        summary: 'User can turn rough ideas into a brief',
        actor: 'User',
        need: 'Capture rough ideas',
        value: 'Avoid writing a full PRD first',
        confidence: 0.94,
        phase_hint: { phase: 2, confidence: 0.81, reason: 'Maps to roadmap phase 2 scope' },
      },
    ]);

    const merge = runGsdTools(['intake', 'merge', '--raw-id', rawOut.raw_id, '--units-file', unitsFile], tmpDir);
    assert.ok(merge.success, `merge failed: ${merge.error}`);
    const output = JSON.parse(merge.output);
    const unit = output.ledger.units[0];

    assert.ok(unit.id);
    assert.strictEqual(unit.type, 'user_story');
    assert.strictEqual(unit.actor, 'User');
    assert.strictEqual(unit.need, 'Capture rough ideas');
    assert.strictEqual(unit.value, 'Avoid writing a full PRD first');
    assert.strictEqual(unit.phase_hint.phase, '2');
    assert.ok(Array.isArray(unit.evidence));
    assert.ok(['tentative', 'reinforced', 'mature', 'conflicted'].includes(unit.status));
  });

  test('readiness output preserves expected decision fields', () => {
    tmpDir = createTempDir();

    const raw = runGsdTools(['intake', 'save-raw', '--text', 'schema readiness'], tmpDir);
    assert.ok(raw.success, `save-raw failed: ${raw.error}`);
    const rawOut = JSON.parse(raw.output);

    const unitsFile = writeUnitsFile(tmpDir, 'readiness-units.json', [
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

    const merge = runGsdTools(['intake', 'merge', '--raw-id', rawOut.raw_id, '--units-file', unitsFile], tmpDir);
    assert.ok(merge.success, `merge failed: ${merge.error}`);

    const decide = runGsdTools(['intake', 'decide'], tmpDir);
    assert.ok(decide.success, `decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.ok(['cold_start', 'initialized_project'].includes(output.mode));
    assert.strictEqual(typeof output.project_ready_score, 'number');
    assert.strictEqual(typeof output.phase_ready_score, 'number');
    assert.strictEqual(typeof output.has_existing_plans, 'boolean');
    assert.strictEqual(typeof output.blocking_conflicts, 'number');
    assert.ok(typeof output.one_line_status === 'string' && output.one_line_status.length > 0);
    assert.ok([
      'collect_more',
      'trigger_new_project',
      'materialize_phase_brief',
      'trigger_plan_phase_prd',
      'idle',
      'backlog_candidate',
    ].includes(output.next_action));
  });
});
