/**
 * GSD Tools Tests - Assess reviewer agent contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('assess reviewer agents', () => {
  const reviewers = [
    ['agents/gsdt-correctness-reviewer.md', 'correctness-reviewer'],
    ['agents/gsdt-testing-reviewer.md', 'testing-reviewer'],
    ['agents/gsdt-maintainability-reviewer.md', 'maintainability-reviewer'],
    ['agents/gsdt-project-standards-reviewer.md', 'project-standards-reviewer'],
    ['agents/gsdt-learnings-researcher.md', 'learnings-researcher'],
    ['agents/gsdt-security-reviewer.md', 'security-reviewer'],
    ['agents/gsdt-performance-reviewer.md', 'performance-reviewer'],
    ['agents/gsdt-reliability-reviewer.md', 'reliability-reviewer'],
    ['agents/gsdt-cli-readiness-reviewer.md', 'cli-readiness-reviewer'],
    ['agents/gsdt-ui-regression-reviewer.md', 'ui-regression-reviewer'],
    ['agents/gsdt-agent-surface-reviewer.md', 'agent-surface-reviewer'],
  ];

  for (const [file, reviewer] of reviewers) {
    test(`${reviewer} follows the structured assess reviewer contract`, () => {
      const content = readRepoFile(file);

      assert.ok(content.includes('If the prompt contains a `<files_to_read>` block'));
      assert.ok(content.includes('## Confidence calibration'));
      assert.ok(content.includes('## What you don\'t flag'));
      assert.ok(content.includes('Return your findings as JSON matching the Assess findings schema.'));
      assert.ok(content.includes(`"reviewer": "${reviewer}"`));
    });
  }

  test('review fixer exists for safe_auto closure', () => {
    const content = readRepoFile('agents/gsdt-review-fixer.md');

    assert.ok(content.includes('Only apply findings where `autofix_class = safe_auto`'));
    assert.ok(content.includes('Return JSON only.'));
    assert.ok(content.includes('"resolved_findings"'));
  });
});
