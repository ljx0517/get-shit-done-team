/**
 * Intake prompt-behavior fixture harness
 */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert');
const { runGsdTools, createTempDir, createTempProject, cleanup } = require('../helpers.cjs');

function fixturePath(name) {
  return path.join(__dirname, '..', 'fixtures', 'intake', 'scenarios', `${name}.json`);
}

function readFixture(name) {
  return JSON.parse(fs.readFileSync(fixturePath(name), 'utf8'));
}

function writeRoadmap(tmpDir, content) {
  const roadmapPath = path.join(tmpDir, '.gsdt-planning', 'ROADMAP.md');
  fs.mkdirSync(path.dirname(roadmapPath), { recursive: true });
  fs.writeFileSync(roadmapPath, content, 'utf8');
}

function setupDefaultInitializedProject(tmpDir, { phase2HasPlan = false } = {}) {
  writeRoadmap(tmpDir, `# Roadmap

## Phase 1: Foundation
**Goal:** Set up project skeleton and state management

## Phase 2: Authentication
**Goal:** Implement user login, logout, and session persistence

## Phase 3: Analytics
**Goal:** Add analytics and reporting surfaces after core flows are stable
`);

  const phasesDir = path.join(tmpDir, '.gsdt-planning', 'phases');
  const phase1 = path.join(phasesDir, '01-foundation');
  const phase2 = path.join(phasesDir, '02-authentication');
  const phase3 = path.join(phasesDir, '03-analytics');
  fs.mkdirSync(phase1, { recursive: true });
  fs.mkdirSync(phase2, { recursive: true });
  fs.mkdirSync(phase3, { recursive: true });

  fs.writeFileSync(path.join(phase1, '01-01-PLAN.md'), '# Plan 1\n', 'utf8');
  fs.writeFileSync(path.join(phase1, '01-01-SUMMARY.md'), '# Summary 1\n', 'utf8');

  if (phase2HasPlan) {
    fs.writeFileSync(path.join(phase2, '02-01-PLAN.md'), '# Plan 2\n', 'utf8');
  }
}

function extractTaggedJson(blockName, text) {
  const pattern = new RegExp(`<${blockName}>\\s*([\\s\\S]*?)\\s*<\\/${blockName}>`);
  const match = String(text).match(pattern);
  if (!match) {
    throw new Error(`Missing <${blockName}> block`);
  }
  return JSON.parse(match[1]);
}

function extractTaggedText(blockName, text) {
  const pattern = new RegExp(`<${blockName}>\\s*([\\s\\S]*?)\\s*<\\/${blockName}>`);
  const match = String(text).match(pattern);
  return match ? match[1].trim() : null;
}

function createRepoForFixture(repoState) {
  const state = repoState || { mode: 'cold_start' };
  if (state.mode === 'initialized_project') {
    const tmpDir = createTempProject();
    setupDefaultInitializedProject(tmpDir, { phase2HasPlan: Boolean(state.phase2HasPlan) });
    return tmpDir;
  }
  return createTempDir();
}

function runFixtureThroughIntake(fixture) {
  const tmpDir = createRepoForFixture(fixture.repo_state);
  try {
    const raw = runGsdTools(['intake', 'save-raw', '--text', fixture.user_input], tmpDir);
    assert.ok(raw.success, `save-raw failed: ${raw.error}`);
    const rawOut = JSON.parse(raw.output);

    const units = extractTaggedJson('intake_units_json', fixture.assistant_output);
    const unitsFile = path.join(tmpDir, 'fixture-units.json');
    fs.writeFileSync(unitsFile, JSON.stringify(units, null, 2), 'utf8');

    const merge = runGsdTools(['intake', 'merge', '--raw-id', rawOut.raw_id, '--units-file', unitsFile], tmpDir);
    assert.ok(merge.success, `merge failed: ${merge.error}`);

    const decide = runGsdTools(['intake', 'decide'], tmpDir);
    assert.ok(decide.success, `decide failed: ${decide.error}`);
    const decideOut = JSON.parse(decide.output);

    return {
      tmpDir,
      raw: rawOut,
      expectedStatusLine: extractTaggedText('intake_status', fixture.assistant_output),
      decide: decideOut,
    };
  } catch (error) {
    cleanup(tmpDir);
    throw error;
  }
}

module.exports = {
  readFixture,
  extractTaggedJson,
  extractTaggedText,
  createRepoForFixture,
  runFixtureThroughIntake,
  cleanup,
};
