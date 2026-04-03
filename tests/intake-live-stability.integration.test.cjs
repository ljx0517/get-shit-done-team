/**
 * GSD Tools Tests - Intake live prompt stability
 *
 * Requires a shell command in GSDT_INTAKE_LIVE_MODEL_COMMAND that accepts the
 * prompt on stdin and returns tagged intake output on stdout.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  runLiveFixtureMultiple,
  isLiveModelConfigured,
  cleanupMany,
} = require('./helpers/intake-live-harness.cjs');

describe('intake live prompt stability', { skip: !isLiveModelConfigured() }, () => {
  test('initialized-phase-auth is stable across repeated live runs', async () => {
    const runs = await runLiveFixtureMultiple('initialized-phase-auth', 3);

    try {
      const nextActions = new Set(runs.map(run => run.decide.next_action));
      const targetPhases = new Set(runs.map(run => run.decide.target_phase || null));

      assert.strictEqual(nextActions.size, 1, `expected stable next_action, got ${[...nextActions].join(', ')}`);
      assert.strictEqual(targetPhases.size, 1, `expected stable target_phase, got ${[...targetPhases].join(', ')}`);
      assert.strictEqual(runs[0].decide.next_action, 'trigger_plan_phase_prd');
      assert.strictEqual(runs[0].decide.target_phase, '2');
    } finally {
      cleanupMany(runs.map(run => run.tmpDir));
    }
  }, 180_000);
});
