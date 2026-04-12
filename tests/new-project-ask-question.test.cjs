const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', 'gsdt', 'workflows', 'new-project.md');

describe('new-project AskQuestion schema guidance', () => {
  test('uses AskQuestion-compatible fields instead of legacy AskUserQuestion shape', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    assert.ok(!content.includes('AskUserQuestion(['), 'should not instruct array-style AskUserQuestion calls');
    assert.ok(!content.includes('multiSelect:'), 'should not reference legacy multiSelect field');
    assert.ok(!content.includes('- header:'), 'should not reference legacy header field');
    assert.ok(!content.includes('- question:'), 'should not reference legacy question field');

    assert.ok(content.includes('title:'), 'should include AskQuestion title guidance');
    assert.ok(content.includes('questions:'), 'should include AskQuestion questions guidance');
    assert.ok(content.includes('id:'), 'should include per-question ids');
    assert.ok(content.includes('prompt:'), 'should include per-question prompts');
    assert.ok(content.includes('allow_multiple:'), 'should include per-question allow_multiple flag');
  });
});
