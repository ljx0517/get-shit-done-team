/**
 * GSD Tools Tests - Assess prompt asset contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('assess prompt assets', () => {
  test('workflow references the three-layer prompt architecture', () => {
    const content = readRepoFile('gsdt/workflows/assess.md');

    assert.ok(content.includes('Prompt Architecture'));
    assert.ok(content.includes('assess-subagent-template.md'));
    assert.ok(content.includes('assess-persona-catalog.md'));
    assert.ok(content.includes('assess-reviewers.md'));
    assert.ok(content.includes('Task('));
    assert.ok(content.includes('subagent_type="gsdt-correctness-reviewer"'));
    assert.ok(content.includes('subagent_type="gsdt-review-fixer"'));
    assert.ok(content.includes('Do not use interactive question tools'));
    assert.ok(content.includes('Do not ask the user'));
  });

  test('subagent template enforces structured low-interruption reviewer behavior', () => {
    const template = readRepoFile('gsdt/references/assess-subagent-template.md');

    assert.ok(template.includes('Return ONLY valid JSON'));
    assert.ok(template.includes('Do not ask the user'));
    assert.ok(template.includes('scope_tier'));
    assert.ok(template.includes('fix_risk'));
    assert.ok(template.includes('verification_hint'));
    assert.ok(template.includes('safe_auto'));
  });

  test('persona catalog defines always-on and conditional reviewer sets', () => {
    const catalog = readRepoFile('gsdt/references/assess-persona-catalog.md');

    assert.ok(catalog.includes('Always-on reviewers'));
    assert.ok(catalog.includes('correctness-reviewer'));
    assert.ok(catalog.includes('gsdt-correctness-reviewer'));
    assert.ok(catalog.includes('maintainability-reviewer'));
    assert.ok(catalog.includes('project-standards-reviewer'));
    assert.ok(catalog.includes('Conditional reviewers'));
    assert.ok(catalog.includes('security-reviewer'));
    assert.ok(catalog.includes('agent-surface-reviewer'));
    assert.ok(catalog.includes('Selection heuristics'));
  });

  test('reviewer registry maps personas to concrete agent files', () => {
    const reviewers = readRepoFile('gsdt/references/assess-reviewers.md');

    assert.ok(reviewers.includes('agents/gsdt-project-standards-reviewer.md'));
    assert.ok(reviewers.includes('agents/gsdt-learnings-researcher.md'));
    assert.ok(reviewers.includes('agents/gsdt-cli-readiness-reviewer.md'));
    assert.ok(reviewers.includes('agents/gsdt-agent-surface-reviewer.md'));
    assert.ok(reviewers.includes('Always-on reviewer agents'));
  });
});
