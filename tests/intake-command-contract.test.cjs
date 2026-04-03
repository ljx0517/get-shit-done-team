/**
 * GSD Tools Tests - Intake command contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('intake command contracts', () => {
  test('intake command defines quiet semantic intake objective', () => {
    const content = readRepoFile('commands/gsdt/intake.md');

    assert.ok(content.includes('Quiet semantic intake'));
    assert.ok(content.includes('semantic-first'));
    assert.ok(content.includes('no questions by default'));
    assert.ok(content.includes('one-line status output'));
    assert.ok(content.includes('Never force the user to write formal requirements or formal user stories'));
  });

  test('intake command supports both cold start and initialized project flows', () => {
    const content = readRepoFile('commands/gsdt/intake.md');

    assert.ok(content.includes('Cold start:'));
    assert.ok(content.includes('Initialized project:'));
    assert.ok(content.includes('/gsdt:new-project --auto'));
    assert.ok(content.includes('/gsdt:plan-phase N --prd'));
  });

  test('intake command exposes required tools for quiet auto-routing', () => {
    const content = readRepoFile('commands/gsdt/intake.md');

    assert.ok(content.includes('allowed-tools:'));
    assert.ok(content.includes('Read'));
    assert.ok(content.includes('Write'));
    assert.ok(content.includes('Bash'));
    assert.ok(content.includes('SlashCommand'));
  });

  test('intake command points to intake workflow', () => {
    const content = readRepoFile('commands/gsdt/intake.md');

    assert.ok(content.includes('@~/.claude/gsdt/workflows/intake.md'));
  });
});
