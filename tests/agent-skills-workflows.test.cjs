/**
 * GSD Tools Tests - Agent skills workflow contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('agent-skills workflow contracts', () => {
  test('workflow keys use canonical agent names', () => {
    const expectations = [
      ['gsdt/workflows/new-project.md', 'agent-skills gsdt-research-synthesizer'],
      ['gsdt/workflows/new-milestone.md', 'agent-skills gsdt-research-synthesizer'],
      ['gsdt/workflows/ui-review.md', 'agent-skills gsdt-ui-auditor'],
      ['gsdt/workflows/discuss-phase.md', 'agent-skills gsdt-advisor-researcher'],
    ];

    for (const [file, expected] of expectations) {
      const content = readRepoFile(file);
      assert.ok(content.includes(expected), `${file} should use canonical key: ${expected}`);
    }
  });

  test('legacy workflow keys are absent from canonical routing points', () => {
    const legacyExpectations = [
      ['gsdt/workflows/new-project.md', 'agent-skills gsd-synthesizer 2>/dev/null'],
      ['gsdt/workflows/new-milestone.md', 'agent-skills gsd-synthesizer 2>/dev/null'],
      ['gsdt/workflows/ui-review.md', 'agent-skills gsd-ui-reviewer 2>/dev/null'],
      ['gsdt/workflows/discuss-phase.md', 'agent-skills gsdt-advisor 2>/dev/null'],
    ];

    for (const [file, legacy] of legacyExpectations) {
      const content = readRepoFile(file);
      assert.ok(!content.includes(legacy), `${file} should not keep legacy key: ${legacy}`);
    }
  });

  test('assess workflow injects agent-skills for reviewer and fixer agents', () => {
    const content = readRepoFile('gsdt/workflows/assess.md');

    const requiredKeys = [
      'agent-skills gsdt-correctness-reviewer',
      'agent-skills gsdt-testing-reviewer',
      'agent-skills gsdt-maintainability-reviewer',
      'agent-skills gsdt-project-standards-reviewer',
      'agent-skills gsdt-learnings-researcher',
      'agent-skills gsdt-security-reviewer',
      'agent-skills gsdt-performance-reviewer',
      'agent-skills gsdt-reliability-reviewer',
      'agent-skills gsdt-cli-readiness-reviewer',
      'agent-skills gsdt-ui-regression-reviewer',
      'agent-skills gsdt-agent-surface-reviewer',
      'agent-skills gsdt-review-fixer',
    ];

    for (const expected of requiredKeys) {
      assert.ok(content.includes(expected), `assess.md should initialize ${expected}`);
    }

    const requiredBlocks = [
      '${AGENT_SKILLS_CORRECTNESS}',
      '${AGENT_SKILLS_TESTING}',
      '${AGENT_SKILLS_MAINTAINABILITY}',
      '${AGENT_SKILLS_PROJECT_STANDARDS}',
      '${AGENT_SKILLS_LEARNINGS}',
      '${AGENT_SKILLS_REVIEW_FIXER}',
    ];

    for (const expected of requiredBlocks) {
      assert.ok(content.includes(expected), `assess.md should inject ${expected}`);
    }
  });

  test('execute-plan injects agent-skills for executor prompts', () => {
    const content = readRepoFile('gsdt/workflows/execute-plan.md');

    assert.ok(
      content.includes('agent-skills gsdt-executor'),
      'execute-plan should initialize executor agent-skills'
    );
    assert.ok(
      content.includes('${AGENT_SKILLS_EXECUTOR}'),
      'execute-plan should include the executor agent-skills block in subagent prompts'
    );
  });
});
