/**
 * GSD Tools Tests - Assess to compound bridge
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  emitResolvedFindingsToCompound,
} = require('../gsdt/bin/lib/review/assess.cjs');
const {
  loadCompoundEvents,
} = require('../gsdt/bin/lib/review/compound.cjs');

function createTempProject(prefix = 'gsdt-assess-compound-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const phaseDir = path.join(tmpDir, '.gsdt-planning', 'phases', '02-test-phase');
  fs.mkdirSync(phaseDir, { recursive: true });
  return { tmpDir, phaseDir };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe('emitResolvedFindingsToCompound', () => {
  let tmpDir;
  let phaseDir;

  beforeEach(() => {
    ({ tmpDir, phaseDir } = createTempProject());
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('emits resolved assess findings into the compound pipeline', async () => {
    const result = await emitResolvedFindingsToCompound(tmpDir, [
      {
        id: 'finding-1',
        title: 'Missing null guard',
        description: 'handler reads item.id before item exists',
        severity: 'P1',
        why_it_matters: 'Primary path can crash on empty state.',
        file: 'src/handler.ts',
        line: 23,
        autofix_class: 'safe_auto',
        fix_risk: 'low',
        scope_tier: 'primary',
        owner: 'review-fixer',
        requires_verification: true,
        verification_hint: 'targeted_test',
        confidence: 0.88,
        evidence: ['stack trace points to handler'],
        suggested_fix: 'guard missing item before dereference',
        root_cause: 'unchecked optional value',
        pre_existing: false,
      },
    ], {
      phase_number: '02',
      phase_name: 'Test Phase',
      phase_dir: path.relative(tmpDir, phaseDir),
    }, {
      skipResearch: true,
    });

    assert.strictEqual(result.emitted.length, 1);
    assert.strictEqual(result.emitted[0].processed, true);

    const stored = loadCompoundEvents(tmpDir);
    assert.strictEqual(stored.events.length, 1);
    assert.strictEqual(stored.events[0].source, 'assess');
    assert.strictEqual(stored.events[0].status, 'resolved');
    assert.ok(fs.existsSync(path.join(tmpDir, '.gsdt-planning', 'compound-memory.json')));
  });
});
