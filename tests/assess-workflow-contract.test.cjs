/**
 * GSD Tools Tests - Assess workflow contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('assess workflow contracts', () => {
  test('assess workflow defines internal automatic review closure', () => {
    const content = readRepoFile('gsdt/workflows/assess.md');

    assert.ok(content.includes('internal_auto'), 'assess should define internal_auto mode');
    assert.ok(content.includes('safe_auto'), 'assess should document safe_auto routing');
    assert.ok(content.includes('gap_closure'), 'assess should route blocking findings into gap closure');
    assert.ok(content.includes('compound dispatch'), 'assess should emit resolved findings to compound');
    assert.ok(content.includes('subagent_type="gsdt-correctness-reviewer"'), 'assess should spawn reviewer agents explicitly');
    assert.ok(content.includes('subagent_type="gsdt-review-fixer"'), 'assess should define review-fixer handoff');
    assert.ok(!content.includes('AskUserQuestion'), 'assess should not introduce user prompts');
  });

  test('execute-phase runs assess after phase verification passes', () => {
    const content = readRepoFile('gsdt/workflows/execute-phase.md');

    assert.ok(content.includes('→ assess_phase'), 'passed verification should route into assess');
    assert.ok(content.includes('<step name="assess_phase">'), 'execute-phase should define assess step');
    assert.ok(content.includes('review assess --phase'), 'execute-phase should invoke review assess');
  });
});
