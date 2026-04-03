/**
 * GSD Tools Tests - Assess routing and CLI
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  routeAssessFindings,
} = require('../gsdt/bin/lib/review/assess.cjs');

const TOOLS_PATH = path.join(__dirname, '..', 'gsdt', 'bin', 'gsdt-tools.cjs');

function createTempProject(prefix = 'gsdt-assess-routing-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const phaseDir = path.join(tmpDir, '.claude/.gsdt-planning', 'phases', '01-test-phase');
  fs.mkdirSync(phaseDir, { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, '.claude/.gsdt-planning', 'ROADMAP.md'),
    '# Roadmap\n\n## Milestone: v1.0 Test\n\n### Phase 1: Test Phase\n**Goal**: Stabilize assess loop\n**Depends on**: None\n**Requirements**: TEST-01\n**Success Criteria**:\n  1. Assess routes findings correctly\n'
  );
  fs.writeFileSync(
    path.join(phaseDir, '01-SUMMARY.md'),
    '# Summary\n\nImplemented assess helpers.\n'
  );
  return { tmpDir, phaseDir };
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function runTools(args, cwd) {
  const result = execFileSync(process.execPath, [TOOLS_PATH, ...args], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return result.trim();
}

describe('routeAssessFindings', () => {
  test('splits safe auto fixes, blocking gaps, and report-only findings', () => {
    const routed = routeAssessFindings([
      {
        id: 'f1',
        title: 'Missing null guard',
        description: 'handler reads item.id before item exists',
        severity: 'P1',
        why_it_matters: 'This crashes the primary interaction path.',
        autofix_class: 'safe_auto',
        fix_risk: 'low',
        scope_tier: 'primary',
        owner: 'review-fixer',
        requires_verification: true,
        verification_hint: 'targeted_test',
        pre_existing: false,
      },
      {
        id: 'f2',
        title: 'Phase contract regression',
        description: 'Summary claims support that the code does not implement.',
        severity: 'P1',
        why_it_matters: 'The phase would ship with an incomplete contract.',
        autofix_class: 'manual',
        fix_risk: 'high',
        scope_tier: 'primary',
        owner: 'downstream-resolver',
        requires_verification: true,
        verification_hint: 'focused_re-review',
        pre_existing: false,
      },
      {
        id: 'f3',
        title: 'Legacy TODO comment',
        description: 'Old note in unchanged helper.',
        severity: 'P3',
        why_it_matters: 'No direct failure mode for this phase.',
        autofix_class: 'advisory',
        fix_risk: 'medium',
        scope_tier: 'pre_existing',
        owner: 'human',
        requires_verification: false,
        verification_hint: 'none',
        pre_existing: true,
      },
    ]);

    assert.deepStrictEqual(routed.safe_auto_queue.map(f => f.id), ['f1']);
    assert.deepStrictEqual(routed.blocking_gaps.map(f => f.id), ['f2']);
    assert.deepStrictEqual(routed.report_only.map(f => f.id), ['f3']);
    assert.strictEqual(routed.summary.blocking_count, 1);
    assert.strictEqual(routed.summary.auto_fixable_count, 1);
    assert.strictEqual(routed.summary.report_only_count, 1);
  });
});

describe('review assess CLI', () => {
  let tmpDir;

  beforeEach(() => {
    ({ tmpDir } = createTempProject());
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns structured assess output and writes artifacts', () => {
    const reviewerOutputFile = path.join(tmpDir, 'reviewers.json');
    fs.writeFileSync(reviewerOutputFile, JSON.stringify([
      {
        reviewer: 'correctness-reviewer',
        findings: [
          {
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
        ],
        residual_risks: [],
        testing_gaps: ['missing null-path unit test'],
      },
    ], null, 2));

    const output = runTools([
      'review',
      'assess',
      '--phase',
      '01',
      '--json',
      '--mode',
      'internal_auto',
      '--reviewer-output-file',
      reviewerOutputFile,
      '--skip-compound',
    ], tmpDir);

    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.type, 'assess');
    assert.strictEqual(parsed.phase, '01');
    assert.strictEqual(parsed.summary.total_raw, 1);
    assert.strictEqual(parsed.routing.safe_auto_queue.length, 1);
    assert.ok(parsed.artifacts.report_path.endsWith('01-ASSESS.md'));
    assert.ok(parsed.artifacts.json_path.endsWith('01-ASSESS.json'));
    assert.ok(fs.existsSync(path.join(tmpDir, parsed.artifacts.report_path)));
    assert.ok(fs.existsSync(path.join(tmpDir, parsed.artifacts.json_path)));
    const report = fs.readFileSync(path.join(tmpDir, parsed.artifacts.report_path), 'utf8');
    assert.ok(report.includes('### Coverage'));
  });
});
