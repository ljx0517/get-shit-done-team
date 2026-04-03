/**
 * Live-model harness for intake prompt integration tests.
 */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert');
const { runGsdTools, cleanup } = require('../helpers.cjs');
const {
  readFixture,
  createRepoForFixture,
} = require('./intake-prompt-harness.cjs');
const {
  assertTaggedIntakeOutput,
} = require('./intake-assertions.cjs');
const {
  isLiveModelConfigured,
  runLiveModel,
} = require('./run-live-model.cjs');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const COMMAND_PATH = path.join(PROJECT_ROOT, 'commands', 'gsdt', 'intake.md');
const WORKFLOW_PATH = path.join(PROJECT_ROOT, 'gsdt', 'workflows', 'intake.md');

function readStaticPromptAssets() {
  return {
    command: fs.readFileSync(COMMAND_PATH, 'utf8'),
    workflow: fs.readFileSync(WORKFLOW_PATH, 'utf8'),
  };
}

function summarizeRepoState(repoState) {
  const state = repoState || { mode: 'cold_start' };
  if (state.mode === 'initialized_project') {
    return [
      '- mode: initialized_project',
      '- roadmap_exists: true',
      '- phase_1: Foundation (complete)',
      `- phase_2: Authentication (active, existing_plan=${Boolean(state.phase2HasPlan) ? 'yes' : 'no'})`,
      '- phase_3: Analytics (future)',
    ].join('\n');
  }

  return [
    '- mode: cold_start',
    '- roadmap_exists: false',
    '- project artifacts: absent',
  ].join('\n');
}

function buildLivePrompt(fixture) {
  const assets = readStaticPromptAssets();
  return [
    'You are running a live prompt-behavior verification for /gsdt:intake.',
    'Follow the command contract and workflow contract below.',
    'Do not ask follow-up questions.',
    'Return ONLY the required tagged blocks and no surrounding prose.',
    '',
    '## Command Contract',
    assets.command,
    '',
    '## Workflow Contract',
    assets.workflow,
    '',
    '## Repository State',
    summarizeRepoState(fixture.repo_state),
    '',
    '## User Input',
    fixture.user_input,
    '',
    '## Output Requirements',
    '- Return exactly two blocks: <intake_units_json> and <intake_status>',
    '- <intake_units_json> must contain valid JSON with shape { "units": [...] }',
    '- <intake_status> must be a single line',
    '- Prefer conservative classification over fabricated user stories',
  ].join('\n');
}

function applyTaggedOutputToRepo(tmpDir, fixture, taggedOutput) {
  const parsed = assertTaggedIntakeOutput(taggedOutput);

  const raw = runGsdTools(['intake', 'save-raw', '--text', fixture.user_input], tmpDir);
  assert.ok(raw.success, `save-raw failed: ${raw.error}`);
  const rawOut = JSON.parse(raw.output);

  const unitsFile = path.join(tmpDir, 'live-units.json');
  fs.writeFileSync(unitsFile, JSON.stringify(parsed.units, null, 2), 'utf8');

  const merge = runGsdTools(['intake', 'merge', '--raw-id', rawOut.raw_id, '--units-file', unitsFile], tmpDir);
  assert.ok(merge.success, `merge failed: ${merge.error}`);

  const decide = runGsdTools(['intake', 'decide'], tmpDir);
  assert.ok(decide.success, `decide failed: ${decide.error}`);

  return {
    units: parsed.units,
    statusLine: parsed.statusLine,
    raw: rawOut,
    decide: JSON.parse(decide.output),
  };
}

async function runLiveFixture(fixtureName) {
  const fixture = readFixture(fixtureName);
  const tmpDir = createRepoForFixture(fixture.repo_state);

  try {
    const prompt = buildLivePrompt(fixture);
    const live = runLiveModel(prompt);
    const replay = applyTaggedOutputToRepo(tmpDir, fixture, live.stdout);

    return {
      fixture,
      tmpDir,
      prompt,
      live_output: live.stdout,
      ...replay,
    };
  } catch (error) {
    cleanup(tmpDir);
    throw error;
  }
}

async function runLiveFixtureMultiple(fixtureName, count) {
  const runs = [];
  for (let index = 0; index < count; index++) {
    runs.push(await runLiveFixture(fixtureName));
  }
  return runs;
}

function cleanupMany(paths) {
  for (const tmpDir of paths) {
    if (tmpDir) cleanup(tmpDir);
  }
}

module.exports = {
  buildLivePrompt,
  isLiveModelConfigured,
  runLiveFixture,
  runLiveFixtureMultiple,
  cleanup,
  cleanupMany,
};
