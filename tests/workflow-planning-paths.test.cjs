const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const workflowsDir = path.join(__dirname, '..', 'gsdt', 'workflows');

function listMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

describe('workflow planning paths', () => {
  test('workflow templates do not reference legacy .claude planning paths', () => {
    const legacyMatches = listMarkdownFiles(workflowsDir)
      .map((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('.claude/.gsdt-planning')
          ? path.relative(path.join(__dirname, '..'), filePath)
          : null;
      })
      .filter(Boolean);

    assert.deepStrictEqual(
      legacyMatches,
      [],
      `workflow templates must use project-root .gsdt-planning paths, found legacy references in: ${legacyMatches.join(', ')}`
    );
  });
});
