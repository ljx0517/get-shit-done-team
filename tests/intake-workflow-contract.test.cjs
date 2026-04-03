/**
 * GSD Tools Tests - Intake workflow contracts
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

describe('intake workflow contracts', () => {
  test('workflow is low interruption by default', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('low-friction semantic intake path'));
    assert.ok(content.includes('quietly transforms raw input'));
    assert.ok(!content.includes('AskUserQuestion('), 'intake should not prompt interactively by default');
  });

  test('workflow defines semantic normalization step with explicit unit types', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<step name="normalize_input">'));
    assert.ok(content.includes('Skill(skill="gsdt:intake-normalize"'));
    assert.ok(content.includes('user_story'));
    assert.ok(content.includes('constraint'));
    assert.ok(content.includes('preference'));
    assert.ok(content.includes('technical_enabler'));
    assert.ok(content.includes('open_question'));
  });

  test('workflow forbids fabricated stories from weak evidence', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('Prefer `constraint` or `preference` over fabricating a `user_story`'));
    assert.ok(content.includes('Technical implementation notes alone MUST NOT be promoted as user stories'));
    assert.ok(content.includes('Only emit `user_story` when there is a meaningful actor + need + value path'));
  });

  test('workflow persists raw input before merge', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<step name="persist_raw">'));
    assert.ok(content.includes('intake save-raw'));
    assert.ok(content.includes('<step name="resolve_units">'));
    assert.ok(content.includes('Skill(skill="gsdt:intake-resolve-units"'));
    assert.ok(content.includes('<intake_resolution_json>'));
    assert.ok(content.includes('<step name="apply_resolution">'));
    assert.ok(content.includes('intake merge --raw-id'));
    assert.ok(content.includes('--resolution-file'));
  });

  test('workflow delegates rendering and materialization to deterministic intake CLI steps', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<step name="render_cards">'));
    assert.ok(content.includes('Skill(skill="gsdt:intake-write-brief"'));
    assert.ok(content.includes('<intake_artifacts_json>'));
    assert.ok(content.includes('intake materialize'));
    assert.ok(content.includes('materialize_project_brief'));
    assert.ok(content.includes('materialize_phase_brief'));
  });

  test('workflow computes readiness via deterministic tool command', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<step name="assess_readiness">'));
    assert.ok(content.includes('Skill(skill="gsdt:intake-assess-readiness"'));
    assert.ok(content.includes('<intake_assessment_json>'));
    assert.ok(content.includes('<step name="evaluate_readiness">'));
    assert.ok(content.includes('intake decide --assessment-file'));
    assert.ok(content.includes('next_action'));
  });

  test('workflow supports cold start auto-handoff to new-project', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('trigger_new_project'));
    assert.ok(content.includes('brief.md'));
    assert.ok(content.includes('SlashCommand("/gsdt:new-project --auto'));
  });

  test('workflow supports initialized-project phase brief handoff', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('materialize_phase_brief'));
    assert.ok(content.includes('trigger_plan_phase_prd'));
    assert.ok(content.includes('SlashCommand("/gsdt:plan-phase ${TARGET_PHASE} --prd'));
  });

  test('workflow explicitly guards against auto-dispatch when plans already exist', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('has no existing `PLAN.md`') || content.includes('has no existing plans'));
    assert.ok(content.includes('has_existing_plans') || content.includes('existing-plans=yes'));
  });

  test('workflow requires machine-readable tagged output blocks', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<intake_units_json>'));
    assert.ok(content.includes('<intake_status>'));
  });

  test('workflow enforces one-line final reporting', () => {
    const content = readRepoFile('gsdt/workflows/intake.md');

    assert.ok(content.includes('<step name="report">'));
    assert.ok(content.includes('Show exactly one line'));
    assert.ok(content.includes('已收纳 |'));
  });
});
