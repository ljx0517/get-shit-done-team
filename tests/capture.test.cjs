/**
 * GSD Tools Tests - Capture decide routing
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createTempProject, cleanup } = require('./helpers.cjs');

const TOOLS_PATH = path.join(__dirname, '..', 'gsdt', 'bin', 'gsdt-tools.cjs');

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

describe('capture decide', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns collect_more on cold start by default', () => {
    const result = runTools(['capture', 'decide'], tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);

    assert.strictEqual(output.roadmap_exists, false);
    assert.strictEqual(output.decision.next_action, 'collect_more');
    assert.strictEqual(output.decision.stage, 'collecting');
  });

  test('triggers new-project on cold start semantic channel', () => {
    const save1 = runTools([
      'capture', 'save',
      '--text', 'multi agent planning core',
      '--intent', 'add',
      '--entities', 'agent,planning,task',
      '--nodes', 'A,B,C,D,E',
      '--edges', 'A:B,B:C',
    ], tmpDir);
    assert.ok(save1.success, `Save 1 failed: ${save1.error}`);

    const save2 = runTools([
      'capture', 'save',
      '--text', 'agent scheduling details',
      '--intent', 'add',
      '--entities', 'agent,scheduling',
      '--nodes', '',
      '--edges', '',
    ], tmpDir);
    assert.ok(save2.success, `Save 2 failed: ${save2.error}`);

    const decide = runTools(['capture', 'decide'], tmpDir);
    assert.ok(decide.success, `Decide failed: ${decide.error}`);
    const output = JSON.parse(decide.output);

    assert.strictEqual(output.roadmap_exists, false);
    assert.strictEqual(output.decision.channels.semantic_ready, true);
    assert.strictEqual(output.decision.next_action, 'trigger_new_project');
    assert.strictEqual(output.decision.stage, 'initializing');
  });

  test('only triggers discuss when roadmap exists', () => {
    const save1 = runTools([
      'capture', 'save',
      '--text', 'discuss readiness fragment one',
      '--intent', 'add',
      '--entities', 'feature',
      '--nodes', 'N1,N2,N3',
      '--edges', 'N1:N2',
    ], tmpDir);
    assert.ok(save1.success, `Save 1 failed: ${save1.error}`);

    const save2 = runTools([
      'capture', 'save',
      '--text', 'fragment two',
      '--intent', 'add',
      '--entities', '',
      '--nodes', '',
      '--edges', '',
    ], tmpDir);
    assert.ok(save2.success, `Save 2 failed: ${save2.error}`);

    const save3 = runTools([
      'capture', 'save',
      '--text', 'fragment three',
      '--intent', 'add',
      '--entities', '',
      '--nodes', '',
      '--edges', '',
    ], tmpDir);
    assert.ok(save3.success, `Save 3 failed: ${save3.error}`);

    const coldDecide = runTools(['capture', 'decide'], tmpDir);
    assert.ok(coldDecide.success, `Cold decide failed: ${coldDecide.error}`);
    const coldOutput = JSON.parse(coldDecide.output);
    assert.strictEqual(coldOutput.roadmap_exists, false);
    assert.strictEqual(coldOutput.decision.next_action, 'collect_more');

    const roadmapPath = path.join(tmpDir, '.gsdt-planning', 'ROADMAP.md');
    fs.writeFileSync(roadmapPath, '# Roadmap: Test\n\n### Phase 1: Init\n');

    const hotDecide = runTools(['capture', 'decide'], tmpDir);
    assert.ok(hotDecide.success, `Hot decide failed: ${hotDecide.error}`);
    const hotOutput = JSON.parse(hotDecide.output);
    assert.strictEqual(hotOutput.roadmap_exists, true);
    assert.strictEqual(hotOutput.decision.channels.discuss_ready, true);
    assert.strictEqual(hotOutput.decision.next_action, 'trigger_discuss_phase');
    assert.strictEqual(hotOutput.decision.stage, 'planning');
  });
});
