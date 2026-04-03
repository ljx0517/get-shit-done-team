/**
 * GSD Tools Tests - Assess schema and merge behavior
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const {
  mergeAssessReviewerOutputs,
} = require('../gsdt/bin/lib/review/assess.cjs');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('assess reference files', () => {
  test('reference contract files exist', () => {
    const referencesDir = path.join(__dirname, '..', 'gsdt', 'references');

    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-findings-schema.json')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-output-template.md')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-subagent-template.md')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-persona-catalog.md')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-diff-scope.md')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-review-output-template.md')));
    assert.ok(fs.existsSync(path.join(referencesDir, 'assess-reviewers.md')));
  });

  test('findings schema requires richer routing metadata', () => {
    const schema = JSON.parse(readRepoFile('gsdt/references/assess-findings-schema.json'));
    const required = schema.properties.findings.items.required;

    assert.ok(required.includes('why_it_matters'));
    assert.ok(required.includes('fix_risk'));
    assert.ok(required.includes('scope_tier'));
    assert.ok(required.includes('verification_hint'));
  });
});

describe('mergeAssessReviewerOutputs', () => {
  test('deduplicates reviewer agreement and boosts confidence', () => {
    const merged = mergeAssessReviewerOutputs([
      {
        reviewer: 'correctness-reviewer',
        findings: [
          {
            title: 'Duplicate request loop',
            description: 'Effect dependency causes repeated refetching.',
            severity: 'P1',
            why_it_matters: 'Users hit redundant requests and stale state under normal usage.',
            file: 'src/comments/list.ts',
            line: 88,
            autofix_class: 'safe_auto',
            fix_risk: 'low',
            scope_tier: 'primary',
            owner: 'review-fixer',
            requires_verification: true,
            verification_hint: 'targeted_test',
            confidence: 0.72,
            evidence: ['useEffect depends on fetched state'],
            pre_existing: false,
          },
        ],
        residual_risks: [],
        testing_gaps: [],
      },
      {
        reviewer: 'performance-reviewer',
        findings: [
          {
            title: 'Duplicate request loop',
            description: 'Effect dependency causes repeated refetching.',
            severity: 'P1',
            why_it_matters: 'Repeated background work can flood the UI path.',
            file: 'src/comments/list.ts',
            line: 89,
            autofix_class: 'safe_auto',
            fix_risk: 'low',
            scope_tier: 'secondary',
            owner: 'review-fixer',
            requires_verification: true,
            verification_hint: 'targeted_test',
            confidence: 0.68,
            evidence: ['query executes on every render'],
            pre_existing: false,
          },
        ],
        residual_risks: ['bulk comment load may still be slow'],
        testing_gaps: ['no concurrency test for rapid comment creation'],
      },
    ], { threshold: 0.6 });

    assert.strictEqual(merged.findings.length, 1);
    assert.strictEqual(merged.summary.total_raw, 2);
    assert.strictEqual(merged.summary.total_after_dedup, 1);
    assert.strictEqual(merged.summary.total_after_filter, 1);
    assert.strictEqual(merged.findings[0].severity, 'P1');
    assert.strictEqual(merged.findings[0].fix_risk, 'low');
    assert.strictEqual(merged.findings[0].verification_hint, 'targeted_test');
    assert.ok(merged.findings[0].confidence > 0.72);
    assert.deepStrictEqual(
      [...merged.findings[0].confirmed_by].sort(),
      ['correctness-reviewer', 'performance-reviewer']
    );
    assert.deepStrictEqual(merged.residual_risks, ['bulk comment load may still be slow']);
    assert.deepStrictEqual(merged.testing_gaps, ['no concurrency test for rapid comment creation']);
  });

  test('filters low-confidence non-P0 findings', () => {
    const merged = mergeAssessReviewerOutputs([
      {
        reviewer: 'testing-reviewer',
        findings: [
          {
            title: 'Speculative maintainability note',
            description: 'Could maybe be simplified later.',
            severity: 'P2',
            why_it_matters: 'No proven breakage is shown.',
            file: 'src/comments/utils.ts',
            line: 14,
            autofix_class: 'advisory',
            fix_risk: 'medium',
            scope_tier: 'secondary',
            owner: 'human',
            requires_verification: false,
            verification_hint: 'none',
            confidence: 0.55,
            evidence: ['nested condition'],
            pre_existing: false,
          },
        ],
        residual_risks: [],
        testing_gaps: [],
      },
    ], { threshold: 0.6 });

    assert.strictEqual(merged.findings.length, 0);
    assert.strictEqual(merged.summary.suppressed_count, 1);
  });

  test('output template keeps assess-specific sections documented', () => {
    const template = readRepoFile('gsdt/references/assess-output-template.md');

    assert.ok(template.includes('### Assess Gaps'));
    assert.ok(template.includes('### Compound Emissions'));
    assert.ok(template.includes('### Learnings & Past Solutions'));
    assert.ok(template.includes('### Coverage'));
    assert.ok(template.includes('Verdict'));
  });
});
