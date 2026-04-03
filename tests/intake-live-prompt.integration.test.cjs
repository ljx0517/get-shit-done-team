/**
 * GSD Tools Tests - Intake live prompt integration
 *
 * Requires a shell command in GSDT_INTAKE_LIVE_MODEL_COMMAND that accepts the
 * prompt on stdin and returns tagged intake output on stdout.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  runLiveFixture,
  isLiveModelConfigured,
  cleanup,
} = require('./helpers/intake-live-harness.cjs');

describe('intake live prompt integration', { skip: !isLiveModelConfigured() }, () => {
  const fixtureNames = [
    'cold-start-story-rich',
    'initialized-phase-auth',
  ];

  for (const fixtureName of fixtureNames) {
    test(`${fixtureName} returns parseable tagged output and expected routing`, async () => {
      const result = await runLiveFixture(fixtureName);

      try {
        assert.ok(Array.isArray(result.units.units), 'live output must return { units: [...] }');
        assert.ok(result.units.units.length > 0, 'live output must produce at least one unit');
        assert.ok(typeof result.statusLine === 'string' && result.statusLine.length > 0, 'live output must include <intake_status>');
        assert.strictEqual(result.decide.next_action, result.fixture.expected.next_action);
        if (result.fixture.expected.target_phase !== undefined) {
          assert.strictEqual(result.decide.target_phase, result.fixture.expected.target_phase);
        }
      } finally {
        cleanup(result.tmpDir);
      }
    }, 120_000);
  }
});
