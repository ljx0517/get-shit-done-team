const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const workflowsDir = path.join(__dirname, '..', 'gsdt', 'workflows');
const outwardFacingFiles = [
  'README.md',
  'README.zh-CN.md',
  'README.ko-KR.md',
  'README.pt-BR.md',
  'CONTRIBUTING.md',
  'agents/gsdt-codebase-mapper.md',
  'docs/superpowers/specs/2026-03-20-multi-project-workspaces-design.md',
].map((filePath) => path.join(repoRoot, filePath));

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
          ? path.relative(repoRoot, filePath)
          : null;
      })
      .filter(Boolean);

    assert.deepStrictEqual(
      legacyMatches,
      [],
      `workflow templates must use project-root .gsdt-planning paths, found legacy references in: ${legacyMatches.join(', ')}`
    );
  });

  test('outward-facing docs and agent prompts do not reference legacy .claude planning paths', () => {
    const legacyMatches = outwardFacingFiles
      .map((filePath) => {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('.claude/.gsdt-planning')
          ? path.relative(repoRoot, filePath)
          : null;
      })
      .filter(Boolean);

    assert.deepStrictEqual(
      legacyMatches,
      [],
      `outward-facing docs and agent prompts must use .gsdt-planning paths, found legacy references in: ${legacyMatches.join(', ')}`
    );
  });
});
