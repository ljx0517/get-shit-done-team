/**
 * GSD Tools Tests - Compound workflow contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('compound workflow contracts', () => {
  test('diagnose-issues dispatches compound through the unified CLI pipeline', () => {
    const content = readRepoFile('gsdt/workflows/diagnose-issues.md');

    assert.ok(content.includes('compound dispatch'), 'diagnose-issues should invoke compound dispatch');
    assert.ok(content.includes('后台自动'), 'diagnose-issues should document background automation');
    assert.ok(!content.includes('subagent_type="gsdt-compound"'), 'diagnose-issues should not depend on gsdt-compound task spawning directly');
  });

  test('debug workflow emits diagnosed compound events without adding user steps', () => {
    const content = readRepoFile('commands/gsdt/debug.md');

    assert.ok(content.includes('compound dispatch'), 'debug should invoke compound dispatch');
    assert.ok(content.includes('后台'), 'debug should describe background compound behavior');
    assert.ok(content.includes('Fix now'), 'existing debug user options should remain intact');
  });

  test('verify-work and execute-phase only emit candidate events on failure paths', () => {
    const verifyWork = readRepoFile('gsdt/workflows/verify-work.md');
    const executePhase = readRepoFile('gsdt/workflows/execute-phase.md');

    assert.ok(verifyWork.includes('compound candidate'), 'verify-work should describe candidate compound events');
    assert.ok(verifyWork.includes('compound dispatch'), 'verify-work should route candidate events into compound dispatch');
    assert.ok(executePhase.includes('compound candidate'), 'execute-phase should describe candidate compound events');
    assert.ok(executePhase.includes('compound dispatch'), 'execute-phase should route candidate events into compound dispatch');
  });

  test('compound-learning documents automatic mode without interactive reuse questions', () => {
    const content = readRepoFile('gsdt/workflows/compound-learning.md');

    assert.ok(content.includes('Automatic Mode'), 'compound-learning should define automatic mode');
    assert.ok(content.includes('不询问用户'), 'automatic mode should explicitly avoid user questions');
    assert.ok(content.includes('dispatch'), 'compound-learning should document dispatch-based invocation');
  });
});
