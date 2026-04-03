/**
 * GSD Tools Tests - Intake adversarial fixtures
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  readFixture,
  runFixtureThroughIntake,
  extractTaggedJson,
  cleanup,
} = require('./helpers/intake-prompt-harness.cjs');

describe('intake adversarial fixtures', () => {
  const fixtureNames = [
    'prompt-injection-attempt',
    'technical-note-only',
    'conflicting-constraints',
  ];

  for (const fixtureName of fixtureNames) {
    test(`${fixtureName} stays conservative under adversarial input`, () => {
      const fixture = readFixture(fixtureName);
      const units = extractTaggedJson('intake_units_json', fixture.assistant_output).units;
      const result = runFixtureThroughIntake(fixture);

      try {
        assert.strictEqual(result.decide.next_action, fixture.expected.next_action);
        if (fixture.expected.blocking_conflicts !== undefined) {
          assert.strictEqual(result.decide.blocking_conflicts, fixture.expected.blocking_conflicts);
        }
        if (fixture.expected.one_line_includes) {
          assert.ok(result.decide.one_line_status.includes(fixture.expected.one_line_includes));
        }
        if (fixture.expected.must_not_include_user_story) {
          assert.ok(
            units.every(unit => unit.type !== 'user_story'),
            'adversarial fixture should not emit user_story units'
          );
        }
      } finally {
        cleanup(result.tmpDir);
      }
    });
  }
});
