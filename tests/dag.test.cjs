/**
 * GSD Tools Tests — DAG validation
 * Unit tests for detectCycles, validateWaveConsistency, validateFileConflicts
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { detectCycles, validateWaveConsistency, validateFileConflicts } = require('../gsdt/bin/lib/dag.cjs');

// ─── detectCycles ─────────────────────────────────────────────────────────────

describe('detectCycles', () => {
  test('returns null for linear chain A→B→C', () => {
    const plans = [
      { id: 'A', depends_on: [] },
      { id: 'B', depends_on: ['A'] },
      { id: 'C', depends_on: ['B'] },
    ];
    assert.strictEqual(detectCycles(plans), null);
  });

  test('returns null for diamond A→B→D, A→C→D', () => {
    const plans = [
      { id: 'A', depends_on: [] },
      { id: 'B', depends_on: ['A'] },
      { id: 'C', depends_on: ['A'] },
      { id: 'D', depends_on: ['B', 'C'] },
    ];
    assert.strictEqual(detectCycles(plans), null);
  });

  test('returns null for independent roots with no edges', () => {
    const plans = [
      { id: 'A', depends_on: [] },
      { id: 'B', depends_on: [] },
      { id: 'C', depends_on: [] },
    ];
    assert.strictEqual(detectCycles(plans), null);
  });

  test('detects self-loop A→A', () => {
    const plans = [
      { id: 'A', depends_on: ['A'] },
    ];
    const cycle = detectCycles(plans);
    assert.ok(cycle, 'Expected cycle to be detected');
    assert.ok(cycle.includes('→'), `Expected arrow in cycle path: ${cycle}`);
    assert.ok(cycle.includes('A'), `Expected A in cycle path: ${cycle}`);
  });

  test('detects 2-node cycle A↔B', () => {
    const plans = [
      { id: 'A', depends_on: ['B'] },
      { id: 'B', depends_on: ['A'] },
    ];
    const cycle = detectCycles(plans);
    assert.ok(cycle, 'Expected cycle to be detected');
    assert.ok(cycle.includes('→'), `Expected arrow in cycle path: ${cycle}`);
    assert.ok(cycle.includes('A'), `Expected A in cycle path: ${cycle}`);
    assert.ok(cycle.includes('B'), `Expected B in cycle path: ${cycle}`);
  });

  test('detects 3-node cycle A→B→C→A', () => {
    const plans = [
      { id: 'A', depends_on: ['C'] },
      { id: 'B', depends_on: ['A'] },
      { id: 'C', depends_on: ['B'] },
    ];
    const cycle = detectCycles(plans);
    assert.ok(cycle, 'Expected cycle to be detected');
    assert.ok(cycle.includes('→'), `Expected arrow in cycle path: ${cycle}`);
    // All three nodes must appear in the cycle
    assert.ok(cycle.includes('A'), `Expected A in cycle path: ${cycle}`);
    assert.ok(cycle.includes('B'), `Expected B in cycle path: ${cycle}`);
    assert.ok(cycle.includes('C'), `Expected C in cycle path: ${cycle}`);
  });

  test('ignores unknown dependencies (not in plans list)', () => {
    const plans = [
      { id: 'A', depends_on: ['X'] },
      { id: 'B', depends_on: ['A'] },
    ];
    assert.strictEqual(detectCycles(plans), null);
  });

  test('returns null for empty plans array', () => {
    assert.strictEqual(detectCycles([]), null);
  });

  test('detects cycle in subgraph with non-participating nodes', () => {
    const plans = [
      { id: 'A', depends_on: [] },
      { id: 'B', depends_on: ['C'] },
      { id: 'C', depends_on: ['B'] },
      { id: 'D', depends_on: ['A'] },
    ];
    const cycle = detectCycles(plans);
    assert.ok(cycle, 'Expected cycle to be detected');
    assert.ok(cycle.includes('B'), `Expected B in cycle: ${cycle}`);
    assert.ok(cycle.includes('C'), `Expected C in cycle: ${cycle}`);
  });
});

// ─── validateWaveConsistency ──────────────────────────────────────────────────

describe('validateWaveConsistency', () => {
  test('returns empty for consistent waves', () => {
    const plans = [
      { id: 'A', wave: 1, depends_on: [] },
      { id: 'B', wave: 2, depends_on: ['A'] },
      { id: 'C', wave: 3, depends_on: ['B'] },
    ];
    assert.deepStrictEqual(validateWaveConsistency(plans), []);
  });

  test('warns when dependency has same wave', () => {
    const plans = [
      { id: 'A', wave: 1, depends_on: [] },
      { id: 'B', wave: 1, depends_on: ['A'] },
    ];
    const warnings = validateWaveConsistency(plans);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('wave should be greater'), `Unexpected warning: ${warnings[0]}`);
  });

  test('warns when dependency has higher wave', () => {
    const plans = [
      { id: 'A', wave: 3, depends_on: [] },
      { id: 'B', wave: 1, depends_on: ['A'] },
    ];
    const warnings = validateWaveConsistency(plans);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('B (wave 1) depends_on A (wave 3)'), `Unexpected warning: ${warnings[0]}`);
  });

  test('returns empty when depends_on is empty', () => {
    const plans = [
      { id: 'A', wave: 1, depends_on: [] },
      { id: 'B', wave: 1, depends_on: [] },
    ];
    assert.deepStrictEqual(validateWaveConsistency(plans), []);
  });

  test('ignores unknown dependencies', () => {
    const plans = [
      { id: 'A', wave: 1, depends_on: ['X'] },
    ];
    assert.deepStrictEqual(validateWaveConsistency(plans), []);
  });

  test('multiple warnings for multiple violations', () => {
    const plans = [
      { id: 'A', wave: 2, depends_on: [] },
      { id: 'B', wave: 1, depends_on: ['A'] },
      { id: 'C', wave: 1, depends_on: ['A'] },
    ];
    const warnings = validateWaveConsistency(plans);
    assert.strictEqual(warnings.length, 2);
  });
});

// ─── validateFileConflicts ────────────────────────────────────────────────────

describe('validateFileConflicts', () => {
  test('returns empty when no file overlaps', () => {
    const plans = [
      { id: 'A', wave: 1, files_modified: ['src/a.ts'] },
      { id: 'B', wave: 1, files_modified: ['src/b.ts'] },
    ];
    assert.deepStrictEqual(validateFileConflicts(plans), []);
  });

  test('warns when same file modified by two plans in same wave', () => {
    const plans = [
      { id: 'A', wave: 1, files_modified: ['src/core.ts'] },
      { id: 'B', wave: 1, files_modified: ['src/core.ts'] },
    ];
    const warnings = validateFileConflicts(plans);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('multiple plans in wave 1'), `Unexpected warning: ${warnings[0]}`);
    assert.ok(warnings[0].includes('A'), `Expected A in warning: ${warnings[0]}`);
    assert.ok(warnings[0].includes('B'), `Expected B in warning: ${warnings[0]}`);
  });

  test('no warning when same file in different waves', () => {
    const plans = [
      { id: 'A', wave: 1, files_modified: ['src/core.ts'] },
      { id: 'B', wave: 2, files_modified: ['src/core.ts'] },
    ];
    assert.deepStrictEqual(validateFileConflicts(plans), []);
  });

  test('handles empty files_modified', () => {
    const plans = [
      { id: 'A', wave: 1, files_modified: [] },
      { id: 'B', wave: 1, files_modified: [] },
    ];
    assert.deepStrictEqual(validateFileConflicts(plans), []);
  });

  test('handles missing files_modified field', () => {
    const plans = [
      { id: 'A', wave: 1 },
      { id: 'B', wave: 1 },
    ];
    assert.deepStrictEqual(validateFileConflicts(plans), []);
  });

  test('detects three-way conflict in same wave', () => {
    const plans = [
      { id: 'A', wave: 1, files_modified: ['src/shared.ts'] },
      { id: 'B', wave: 1, files_modified: ['src/shared.ts'] },
      { id: 'C', wave: 1, files_modified: ['src/shared.ts'] },
    ];
    const warnings = validateFileConflicts(plans);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].includes('A'), `Expected A in warning: ${warnings[0]}`);
    assert.ok(warnings[0].includes('B'), `Expected B in warning: ${warnings[0]}`);
    assert.ok(warnings[0].includes('C'), `Expected C in warning: ${warnings[0]}`);
  });
});
