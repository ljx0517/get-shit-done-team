const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', 'gsdt', 'workflows', 'new-project.md');

describe('new-project workflow defaults', () => {
  test('hardcodes fine-grained parallel git-tracked defaults instead of prompting', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');

    const blockedPrompts = [
      'question: "How finely should scope be sliced into phases?"',
      'question: "Run plans in parallel?"',
      'question: "Commit planning docs to git?"',
    ];

    for (const prompt of blockedPrompts) {
      assert.ok(
        !content.includes(prompt),
        `new-project workflow should not prompt for fixed defaults, but still contains: ${prompt}`
      );
    }

    assert.ok(
      content.includes('"granularity":"fine"'),
      'new-project workflow should hardcode granularity to fine'
    );
    assert.ok(
      content.includes('"parallelization":true'),
      'new-project workflow should hardcode parallelization to true'
    );
    assert.ok(
      content.includes('"commit_docs":true'),
      'new-project workflow should hardcode commit_docs to true'
    );
    assert.ok(
      !content.includes('~/.gsdt/defaults.json'),
      'new-project workflow should not reference the stale ~/.gsdt/defaults.json path'
    );
    assert.ok(
      content.includes('~/.gsd/defaults.json'),
      'new-project workflow should reference ~/.gsd/defaults.json for global defaults'
    );
  });
});
