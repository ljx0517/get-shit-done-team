/**
 * GSD Tools Tests - Intake prompt-behavior fixtures
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const { readFixture, runFixtureThroughIntake, cleanup } = require('./helpers/intake-prompt-harness.cjs');

describe('intake prompt behavior fixtures', () => {
  const fixtureNames = [
    'cold-start-story-rich',
    'initialized-phase-auth',
    'initialized-phase-existing-plan',
    'future-backlog-candidate',
  ];

  for (const fixtureName of fixtureNames) {
    test(`${fixtureName} routes according to semantic readiness`, () => {
      const fixture = readFixture(fixtureName);
      const result = runFixtureThroughIntake(fixture);

      try {
        assert.strictEqual(result.decide.mode, fixture.expected.mode);
        assert.strictEqual(result.decide.next_action, fixture.expected.next_action);

        if (fixture.expected.target_phase !== undefined) {
          assert.strictEqual(result.decide.target_phase, fixture.expected.target_phase);
        }
        if (fixture.expected.has_existing_plans !== undefined) {
          assert.strictEqual(result.decide.has_existing_plans, fixture.expected.has_existing_plans);
        }
        if (fixture.expected.one_line_includes) {
          assert.ok(
            result.decide.one_line_status.includes(fixture.expected.one_line_includes),
            `Expected one-line status to include "${fixture.expected.one_line_includes}", got "${result.decide.one_line_status}"`
          );
        }
        if (result.expectedStatusLine) {
          assert.ok(
            result.expectedStatusLine.includes(`next=${fixture.expected.next_action}`),
            `Expected tagged status to reflect next action, got "${result.expectedStatusLine}"`
          );
        }
      } finally {
        cleanup(result.tmpDir);
      }
    });
  }
});
