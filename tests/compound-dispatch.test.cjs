/**
 * GSD Tools Tests - Compound dispatch and dedupe
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execFileSync, execSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  dispatchCompoundEvent,
  loadCompoundEvents,
} = require('../gsdt/bin/lib/review/compound.cjs');

const TOOLS_PATH = path.join(__dirname, '..', 'gsdt', 'bin', 'gsdt-tools.cjs');
const INSTALL_HOOKS_PATH = path.join(__dirname, '..', 'gsdt', 'bin', 'install-hooks.js');
const POST_COMMIT_TEMPLATE_PATH = path.join(__dirname, '..', 'gsdt', 'hooks', 'post-commit.tpl');

function createTempProject(prefix = 'gsdt-compound-dispatch-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(tmpDir, '.claude/.gsdt-planning'), { recursive: true });
  return tmpDir;
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function createTempGitProject(prefix = 'gsdt-compound-hook-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(tmpDir, '.claude/.gsdt-planning'), { recursive: true });
  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });
  return tmpDir;
}

function runTools(args, cwd) {
  try {
    const result = execFileSync(process.execPath, [TOOLS_PATH, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}

describe('dispatchCompoundEvent', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('stores candidate events without producing docs', async () => {
    const result = await dispatchCompoundEvent(tmpDir, {
      source: 'verify-work',
      status: 'candidate',
      problem: 'Comment does not refresh after submit',
      symptoms: ['Comment appears only after manual refresh'],
      severity: 'major',
      phase: '04',
      tags: ['uat'],
    }, { skipResearch: true });

    assert.strictEqual(result.processed, false);
    assert.strictEqual(result.reason, 'candidate_only');

    const stored = loadCompoundEvents(tmpDir);
    assert.strictEqual(stored.events.length, 1);
    assert.strictEqual(stored.events[0].status, 'candidate');
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'docs', 'solutions')), false);
  });

  test('upgrades a candidate event and compounds it once root cause is known', async () => {
    await dispatchCompoundEvent(tmpDir, {
      source: 'verify-work',
      status: 'candidate',
      problem: 'Comment does not refresh after submit',
      symptoms: ['Comment appears only after manual refresh'],
      severity: 'major',
      phase: '04',
      tags: ['uat'],
    }, { skipResearch: true });

    const result = await dispatchCompoundEvent(tmpDir, {
      source: 'diagnose-issues',
      status: 'diagnosed',
      problem: 'Comment does not refresh after submit',
      symptoms: ['Comment appears only after manual refresh'],
      root_cause: 'Missing dependency in CommentList useEffect',
      severity: 'major',
      phase: '04',
      files: ['src/components/CommentList.tsx'],
      suggested_fix: 'Add the comment count dependency to useEffect',
      tags: ['uat', 'comments'],
    }, { skipResearch: true });

    assert.strictEqual(result.processed, true);
    assert.ok(result.solution_doc.includes(path.join('docs', 'solutions')));

    const stored = loadCompoundEvents(tmpDir);
    assert.strictEqual(stored.events.length, 1);
    assert.strictEqual(stored.events[0].status, 'diagnosed');
    assert.strictEqual(stored.events[0].compound_state, 'compounded');

    assert.ok(fs.existsSync(path.join(tmpDir, '.claude/.gsdt-planning', 'compound-memory.json')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude/.gsdt-planning', 'anti-patterns.md')));
  });

  test('skips repeat dispatch after the event has already been compounded', async () => {
    const event = {
      source: 'debug',
      status: 'diagnosed',
      problem: 'Comment does not refresh after submit',
      symptoms: ['Comment appears only after manual refresh'],
      root_cause: 'Missing dependency in CommentList useEffect',
      severity: 'major',
      phase: '04',
      files: ['src/components/CommentList.tsx'],
      suggested_fix: 'Add the comment count dependency to useEffect',
      tags: ['comments'],
    };

    const first = await dispatchCompoundEvent(tmpDir, event, { skipResearch: true });
    const second = await dispatchCompoundEvent(tmpDir, event, { skipResearch: true });

    assert.strictEqual(first.processed, true);
    assert.strictEqual(second.processed, false);
    assert.strictEqual(second.reason, 'already_compounded');
    assert.strictEqual(loadCompoundEvents(tmpDir).events.length, 1);
  });

  test('diagnosed low-severity events still write a solution doc', async () => {
    const result = await dispatchCompoundEvent(tmpDir, {
      source: 'debug',
      status: 'diagnosed',
      problem: 'Tooltip is one pixel off in dark mode',
      symptoms: ['Tooltip alignment shifts slightly on hover'],
      root_cause: 'Missing dark mode offset utility class',
      severity: 'cosmetic',
      phase: '07',
      files: ['src/components/Tooltip.tsx'],
      suggested_fix: 'Apply the dark-mode offset class in the tooltip container',
      tags: ['ui'],
    }, { skipResearch: true });

    assert.strictEqual(result.processed, true);
    assert.ok(result.solution_doc.includes(path.join('docs', 'solutions')));
    assert.ok(fs.existsSync(result.solution_doc));
  });
});

describe('compound dispatch CLI', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('accepts --event-json and returns structured JSON', () => {
    const event = JSON.stringify({
      source: 'verify-work',
      status: 'candidate',
      problem: 'Comment does not refresh after submit',
      symptoms: ['Comment appears only after manual refresh'],
      severity: 'major',
    });

    const result = runTools(['compound', 'dispatch', '--event-json', event, '--no-research'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.processed, false);
    assert.strictEqual(output.reason, 'candidate_only');
  });

  test('returns structured JSON for invalid event payloads instead of crashing', () => {
    const result = runTools(['compound', 'dispatch', '--event-json', '{"source":', '--no-research'], tmpDir);
    assert.ok(result.success, `Command should not hard fail: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.processed, false);
    assert.strictEqual(output.reason, 'invalid_event_json');
    assert.ok(output.error);
  });
});

describe('compound hook CLI', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('ignores non-bugfix commits', () => {
    const result = runTools([
      'compound',
      'hook',
      '--event', 'post-commit',
      '--commit-hash', 'abc1234',
      '--commit-msg', 'docs: update user guide',
      '--files', 'README.md\ndocs/USER-GUIDE.md',
      '--no-research',
    ], tmpDir);

    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.processed, false);
    assert.strictEqual(output.reason, 'not_relevant');
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.claude/.gsdt-planning', 'compound-events.json')), false);
  });

  test('stores candidate event for bugfix commits without clear root cause clues', () => {
    const result = runTools([
      'compound',
      'hook',
      '--event', 'post-commit',
      '--commit-hash', 'abc1234',
      '--commit-msg', 'fix(comments): refresh comment list after submit',
      '--files', 'src/components/CommentList.tsx\nsrc/api/comments.ts',
      '--no-research',
    ], tmpDir);

    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.processed, false);
    assert.strictEqual(output.reason, 'candidate_only');

    const stored = loadCompoundEvents(tmpDir);
    assert.strictEqual(stored.events.length, 1);
    assert.strictEqual(stored.events[0].source, 'post-commit');
    assert.strictEqual(stored.events[0].status, 'candidate');
    assert.strictEqual(stored.events[0].commit_hash, 'abc1234');
    assert.strictEqual(stored.events[0].commit_message, 'fix(comments): refresh comment list after submit');
    assert.deepStrictEqual(stored.events[0].files, ['src/components/CommentList.tsx', 'src/api/comments.ts']);
  });

  test('heuristically promotes bugfix commits with root cause clues to diagnosed events', () => {
    const result = runTools([
      'compound',
      'hook',
      '--event', 'post-commit',
      '--commit-hash', 'def5678',
      '--commit-msg', 'fix(comments): refresh comment list after submit due to missing dependency in CommentList useEffect',
      '--files', 'src/components/CommentList.tsx',
      '--no-research',
    ], tmpDir);

    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.processed, true);
    assert.strictEqual(output.reason, 'compounded');
    assert.ok(output.solution_doc.includes(path.join('docs', 'solutions')));

    const stored = loadCompoundEvents(tmpDir);
    assert.strictEqual(stored.events.length, 1);
    assert.strictEqual(stored.events[0].source, 'post-commit');
    assert.strictEqual(stored.events[0].status, 'diagnosed');
    assert.ok(stored.events[0].root_cause.includes('missing dependency'));
    assert.ok(fs.existsSync(output.solution_doc));
  });
});

describe('install-hooks', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('installs the canonical post-commit template', () => {
    execFileSync(process.execPath, [INSTALL_HOOKS_PATH], {
      cwd: tmpDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const installedHook = fs.readFileSync(path.join(tmpDir, '.git', 'hooks', 'post-commit'), 'utf8');
    const template = fs.readFileSync(POST_COMMIT_TEMPLATE_PATH, 'utf8');
    assert.strictEqual(installedHook, template);
    assert.ok((fs.statSync(path.join(tmpDir, '.git', 'hooks', 'post-commit')).mode & 0o111) !== 0, 'hook should be executable');
  });
});
