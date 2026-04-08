const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', 'gsdt', 'workflows', 'settings.md');

describe('settings workflow options', () => {
  test('settings workflow includes editable core strategy defaults', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    const requiredPrompts = [
      'question: "How do you want to work?"',
      'question: "How finely should scope be sliced into phases?"',
      'question: "Run plans in parallel?"',
      'question: "Commit planning docs to git?"',
      'question: "Discussion style for /gsdt:discuss-phase?"',
    ];

    for (const prompt of requiredPrompts) {
      assert.ok(
        content.includes(prompt),
        `settings workflow should allow editing core strategy defaults, missing prompt: ${prompt}`
      );
    }

    assert.ok(
      content.includes('"mode": "yolo" | "interactive"'),
      'settings workflow should write mode back to config'
    );
    assert.ok(
      content.includes('"granularity": "coarse" | "standard" | "fine"'),
      'settings workflow should write granularity back to config'
    );
    assert.ok(
      content.includes('"parallelization": true/false'),
      'settings workflow should write parallelization back to config'
    );
    assert.ok(
      content.includes('"commit_docs": true/false'),
      'settings workflow should write commit_docs back to config'
    );
    assert.ok(
      content.includes('"discuss_mode": "discuss" | "assumptions"'),
      'settings workflow should write discuss_mode back to config'
    );
    assert.ok(
      !content.includes('~/.gsdt/defaults.json'),
      'settings workflow should not reference the stale ~/.gsdt/defaults.json path'
    );
    assert.ok(
      content.includes('~/.gsd/defaults.json'),
      'settings workflow should reference ~/.gsd/defaults.json for global defaults'
    );
  });
});
