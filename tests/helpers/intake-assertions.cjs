/**
 * Shared assertions for intake prompt outputs.
 */
const assert = require('node:assert');
const {
  extractTaggedJson,
  extractTaggedText,
} = require('./intake-prompt-harness.cjs');

const ALLOWED_TYPES = new Set([
  'user_story',
  'constraint',
  'preference',
  'technical_enabler',
  'open_question',
]);

function parseTaggedIntakeOutput(outputText) {
  const units = extractTaggedJson('intake_units_json', outputText);
  const statusLine = extractTaggedText('intake_status', outputText);
  return { units, statusLine };
}

function assertIntakeUnitsShape(unitsPayload) {
  assert.ok(unitsPayload && typeof unitsPayload === 'object', 'units payload must be an object');
  assert.ok(Array.isArray(unitsPayload.units), 'units payload must contain a units array');
  assert.ok(unitsPayload.units.length > 0, 'units array must not be empty');

  for (const unit of unitsPayload.units) {
    assert.ok(ALLOWED_TYPES.has(unit.type), `invalid unit type: ${unit.type}`);
    assert.ok(typeof unit.summary === 'string' && unit.summary.trim().length > 0, 'each unit needs a non-empty summary');
    if (unit.phase_hint) {
      assert.ok(unit.phase_hint.phase !== undefined && unit.phase_hint.phase !== null, 'phase_hint.phase is required when phase_hint exists');
    }
  }
}

function assertTaggedIntakeOutput(outputText) {
  const parsed = parseTaggedIntakeOutput(outputText);
  assertIntakeUnitsShape(parsed.units);
  assert.ok(typeof parsed.statusLine === 'string' && parsed.statusLine.length > 0, 'missing or empty <intake_status> block');
  return parsed;
}

module.exports = {
  assertIntakeUnitsShape,
  assertTaggedIntakeOutput,
  parseTaggedIntakeOutput,
};
