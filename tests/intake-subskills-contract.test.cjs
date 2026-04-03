/**
 * GSD Tools Tests - Intake subskills contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('intake subskills contracts', () => {
  const commands = [
    {
      name: 'gsdt:intake-normalize',
      commandPath: 'commands/gsdt/intake-normalize.md',
      workflowPath: 'gsdt/workflows/intake-normalize.md',
      outputTag: '<intake_units_json>',
    },
    {
      name: 'gsdt:intake-resolve-units',
      commandPath: 'commands/gsdt/intake-resolve-units.md',
      workflowPath: 'gsdt/workflows/intake-resolve-units.md',
      outputTag: '<intake_resolution_json>',
    },
    {
      name: 'gsdt:intake-assess-readiness',
      commandPath: 'commands/gsdt/intake-assess-readiness.md',
      workflowPath: 'gsdt/workflows/intake-assess-readiness.md',
      outputTag: '<intake_assessment_json>',
    },
    {
      name: 'gsdt:intake-write-brief',
      commandPath: 'commands/gsdt/intake-write-brief.md',
      workflowPath: 'gsdt/workflows/intake-write-brief.md',
      outputTag: '<intake_artifacts_json>',
    },
  ];

  for (const command of commands) {
    test(`${command.name} command exists and points to its workflow`, () => {
      const content = readRepoFile(command.commandPath);

      assert.ok(content.includes(`name: ${command.name}`));
      assert.ok(content.includes('<execution_context>'));
      assert.ok(content.includes(`@~/.claude/${command.workflowPath}`));
      assert.ok(content.includes('<process>'));
    });

    test(`${command.name} workflow defines machine-readable output`, () => {
      const content = readRepoFile(command.workflowPath);

      assert.ok(content.includes(command.outputTag));
      assert.ok(!content.includes('AskUserQuestion('), 'intake subskills should remain low interruption');
      assert.ok(content.includes('Return'));
    });
  }
});
