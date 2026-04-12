/**
 * Tests for multi-runtime selection in the interactive installer prompt.
 * Verifies that promptRuntime accepts comma-separated, space-separated,
 * and single-choice inputs, deduplicates, and falls back to claude.
 * See issue #1281.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

// Read install.js source to extract the runtimeMap and parsing logic
const installSrc = fs.readFileSync(
  path.join(__dirname, '..', 'bin', 'install.js'),
  'utf8'
);

const RUNTIME_VIBE_AGENT_TEAM = 'vibeAgentTeam';

// Extract runtimeMap from install.js (must stay in sync with promptRuntime)
const runtimeMap = {
  '1': 'claude',
  '2': 'antigravity',
  '3': 'augment',
  '4': 'cline',
  '5': 'codebuddy',
  '6': 'codex',
  '7': 'copilot',
  '8': 'cursor',
  '9': 'gemini',
  '10': 'kilo',
  '11': RUNTIME_VIBE_AGENT_TEAM,
  '12': 'qwen',
  '13': 'trae',
  '14': 'windsurf',
};
const allRuntimes = [
  'claude',
  'antigravity',
  'augment',
  'cline',
  'codebuddy',
  'codex',
  'copilot',
  'cursor',
  'gemini',
  'kilo',
  RUNTIME_VIBE_AGENT_TEAM,
  'qwen',
  'trae',
  'windsurf',
];

/**
 * Simulate the parsing logic from promptRuntime without requiring readline.
 * This mirrors the exact logic in the rl.question callback.
 */
function parseRuntimeInput(input) {
  input = input.trim() || '1';

  if (input === '15') {
    return allRuntimes;
  }

  const choices = input.split(/[\s,]+/).filter(Boolean);
  const selected = [];
  for (const c of choices) {
    const runtime = runtimeMap[c];
    if (runtime && !selected.includes(runtime)) {
      selected.push(runtime);
    }
  }

  return selected.length > 0 ? selected : ['claude'];
}

describe('multi-runtime selection parsing', () => {
  test('single choice returns single runtime', () => {
    assert.deepStrictEqual(parseRuntimeInput('1'), ['claude']);
    assert.deepStrictEqual(parseRuntimeInput('6'), ['codex']);
    assert.deepStrictEqual(parseRuntimeInput('8'), ['cursor']);
  });

  test('comma-separated choices return multiple runtimes', () => {
    assert.deepStrictEqual(parseRuntimeInput('1,4,2'), ['claude', 'cline', 'antigravity']);
    assert.deepStrictEqual(parseRuntimeInput('11,9'), [RUNTIME_VIBE_AGENT_TEAM, 'gemini']);
  });

  test('space-separated choices return multiple runtimes', () => {
    assert.deepStrictEqual(parseRuntimeInput('1 4 2'), ['claude', 'cline', 'antigravity']);
    assert.deepStrictEqual(parseRuntimeInput('7 8'), ['copilot', 'cursor']);
  });

  test('mixed comma and space separators work', () => {
    assert.deepStrictEqual(parseRuntimeInput('1, 4, 2'), ['claude', 'cline', 'antigravity']);
    assert.deepStrictEqual(parseRuntimeInput('11 , 7'), [RUNTIME_VIBE_AGENT_TEAM, 'copilot']);
  });

  test('single choice for windsurf', () => {
    assert.deepStrictEqual(parseRuntimeInput('14'), ['windsurf']);
  });

  test('choice 15 returns all runtimes', () => {
    assert.deepStrictEqual(parseRuntimeInput('15'), allRuntimes);
  });

  test('empty input defaults to claude', () => {
    assert.deepStrictEqual(parseRuntimeInput(''), ['claude']);
    assert.deepStrictEqual(parseRuntimeInput('   '), ['claude']);
  });

  test('invalid choices are ignored, falls back to claude if all invalid', () => {
    assert.deepStrictEqual(parseRuntimeInput('99'), ['claude']);
    assert.deepStrictEqual(parseRuntimeInput('0'), ['claude']);
    assert.deepStrictEqual(parseRuntimeInput('abc'), ['claude']);
  });

  test('invalid choices mixed with valid are filtered out', () => {
    assert.deepStrictEqual(parseRuntimeInput('1,6,4'), ['claude', 'codex', 'cline']);
    assert.deepStrictEqual(parseRuntimeInput('abc 9 xyz'), ['gemini']);
  });

  test('duplicate choices are deduplicated', () => {
    assert.deepStrictEqual(parseRuntimeInput('1,1,1'), ['claude']);
    assert.deepStrictEqual(parseRuntimeInput('4,4,6,6'), ['cline', 'codex']);
  });

  test('preserves selection order', () => {
    assert.deepStrictEqual(parseRuntimeInput('2,1,4'), ['antigravity', 'claude', 'cline']);
    assert.deepStrictEqual(parseRuntimeInput('8,11,7'), ['cursor', RUNTIME_VIBE_AGENT_TEAM, 'copilot']);
  });
});

describe('install.js source contains multi-select support', () => {
  test('runtimeMap is defined with all 14 runtimes + Vibe Agent Team', () => {
    for (const [key, name] of Object.entries(runtimeMap)) {
      if (key === '11') {
        assert.ok(
          installSrc.includes(`'11': RUNTIME_VIBE_AGENT_TEAM`),
          `runtimeMap has 11 -> ${RUNTIME_VIBE_AGENT_TEAM}`
        );
        continue;
      }
      assert.ok(
        installSrc.includes(`'${key}': '${name}'`),
        `runtimeMap has ${key} -> ${name}`
      );
    }
  });

  test('allRuntimes array contains all runtimes', () => {
    const match = installSrc.match(/const allRuntimes = \[[\s\S]*?\];/);
    assert.ok(match, 'allRuntimes array found');
    const block = match[0];
    assert.ok(block.includes('RUNTIME_VIBE_AGENT_TEAM'), 'allRuntimes includes Vibe Agent Team runtime');
    for (const rt of ['claude', 'gemini', 'codex', 'copilot', 'antigravity', 'cursor', 'windsurf', 'kilo', 'augment', 'cline', 'qwen', 'trae', 'codebuddy']) {
      assert.ok(block.includes(`'${rt}'`), `allRuntimes includes ${rt}`);
    }
  });

  test('prompt text shows multi-select hint', () => {
    assert.ok(
      installSrc.includes('Select multiple'),
      'prompt includes multi-select instructions'
    );
  });

  test('parsing uses split with comma and space regex', () => {
    assert.ok(
      installSrc.includes("split(/[\\s,]+/)"),
      'input is split on commas and whitespace'
    );
  });

  test('deduplication check exists', () => {
    assert.ok(
      installSrc.includes('!selected.includes(runtime)'),
      'deduplication guard exists'
    );
  });
});
