<purpose>
Provide a low-friction semantic intake path for freeform text.
This workflow quietly transforms raw input into structured planning units and promotes them only when mature.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate_input">
If `$ARGUMENTS` is empty or whitespace-only, show exactly one line and stop:

`请输入一句想法，例如：/gsdt:intake 我想做一个零 friction 的需求整理入口`
</step>

<step name="ensure_intake_root">
Run:
```bash
STATE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake state)
if [[ "$STATE" == @file:* ]]; then STATE=$(cat "${STATE#@file:}"); fi
```

Parse:
- `project_exists`
- `roadmap_exists`
- `intake_root`
- `planning_root`
- `ledger_path`
- `cards_path`
- `brief_path`
- `readiness_path`
- `active_phase`
- `phase_dirs`
- `existing_plans_by_phase`
- `phase_statuses`

Always use `.claude/.gsdt-intake/` as the intake memory root.
</step>

<step name="load_existing_context">
Read existing intake artifacts if present:
- `ledger.json`
- `readiness.json`
- `brief.md`
- `cards.md`

If initialized project:
- read `ROADMAP.md`
- read `STATE.md`
- read the active phase section from ROADMAP if available
- read whether each phase has existing `PLAN.md`
</step>

<step name="normalize_input">
Delegate semantic normalization to the dedicated intake subskill:
`Skill(skill="gsdt:intake-normalize", args="$ARGUMENTS")`

Allowed unit types:
- `user_story`
- `constraint`
- `preference`
- `technical_enabler`
- `open_question`

Normalization guardrails:
- preserve the original wording as evidence
- Prefer `constraint` or `preference` over fabricating a `user_story`
- Only emit `user_story` when there is a meaningful actor + need + value path
- if actor or value is unclear, reduce confidence or emit `open_question`
- Technical implementation notes alone MUST NOT be promoted as user stories
- future-looking or out-of-scope ideas SHOULD be tagged as backlog-oriented instead of forced into current-phase scope
- if initialized project, compute `phase_hint` only when there is concrete overlap with a roadmap phase goal or phase requirement area

Capture the returned machine-readable block:
<intake_units_json>
{"units":[...]}
</intake_units_json>
</step>

<step name="persist_raw">
Run:
```bash
RAW=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake save-raw --text "$ARGUMENTS")
if [[ "$RAW" == @file:* ]]; then RAW=$(cat "${RAW#@file:}"); fi
```
</step>

<step name="resolve_units">
Delegate semantic dedupe and conflict resolution to the dedicated intake subskill:
`Skill(skill="gsdt:intake-resolve-units", args="$ARGUMENTS")`

This skill is responsible for:
- canonicalization
- duplicate detection
- conflict surfacing
- conservative `phase_hint` retention

Capture the returned machine-readable block:
<intake_resolution_json>
{
  "canonical_units": [...],
  "duplicates": [...],
  "conflicts": [...]
}
</intake_resolution_json>
</step>

<step name="apply_resolution">
Write the resolution JSON to a temp file, then run:
```bash
MERGE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake merge --raw-id "$RAW_ID" --resolution-file "$RESOLUTION_FILE")
if [[ "$MERGE" == @file:* ]]; then MERGE=$(cat "${MERGE#@file:}"); fi
```
</step>

<step name="assess_readiness">
Delegate semantic readiness assessment to the dedicated intake subskill:
`Skill(skill="gsdt:intake-assess-readiness")`

This skill recommends the next action semantically, while the deterministic CLI keeps final safety guards.

Capture the returned machine-readable block:
<intake_assessment_json>
{
  "recommended_action": "collect_more|trigger_new_project|materialize_phase_brief|trigger_plan_phase_prd|idle|backlog_candidate",
  "mode": "cold_start|initialized_project",
  "target_phase": "2",
  "target_phase_confidence": 0.93,
  "project_ready_score": 0.61,
  "phase_ready_score": 0.87,
  "why": ["..."]
}
</intake_assessment_json>
</step>

<step name="evaluate_readiness">
Write the assessment JSON to a temp file, then run:
```bash
DECIDE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake decide --assessment-file "$ASSESSMENT_FILE")
if [[ "$DECIDE" == @file:* ]]; then DECIDE=$(cat "${DECIDE#@file:}"); fi
```

Parse:
- `next_action`
- `target_phase`
- `target_phase_confidence`
- `has_existing_plans`

Valid `next_action` values:
- `collect_more`
- `trigger_new_project`
- `materialize_phase_brief`
- `trigger_plan_phase_prd`
- `idle`
- `backlog_candidate`
</step>

<step name="render_cards">
Delegate artifact drafting to the dedicated intake subskill:
`Skill(skill="gsdt:intake-write-brief")`

This skill drafts markdown content only. Deterministic CLI materialization still writes the files and preserves dispatch boundaries.

Capture the returned machine-readable block:
<intake_artifacts_json>
{
  "cards_markdown": "# Intake Cards\n...",
  "project_brief_markdown": "# Intake Brief\n...",
  "phase_brief_markdown": "# Phase 2 Intake Brief\n...",
  "one_line_status": "已收纳 | phase=2 conf=0.93 | next=trigger_plan_phase_prd"
}
</intake_artifacts_json>

Requirements:
- `cards_markdown` should summarize all canonical units
- `project_brief_markdown` should be strong enough to feed `new-project --auto`
- `phase_brief_markdown` should be strong enough to feed `plan-phase --prd`
- `one_line_status` must stay single-line and match the decision outcome
</step>

<step name="materialize_project_brief">
Skip unless `next_action=trigger_new_project`.

Write the artifacts JSON to a temp file, then run:
```bash
MATERIALIZE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake materialize --artifacts-file "$ARTIFACTS_FILE")
if [[ "$MATERIALIZE" == @file:* ]]; then MATERIALIZE=$(cat "${MATERIALIZE#@file:}"); fi
```

Use the generated `.claude/.gsdt-intake/brief.md`, then dispatch:
```bash
SlashCommand("/gsdt:new-project --auto @.claude/.gsdt-intake/brief.md")
```
</step>

<step name="materialize_phase_brief">
Skip unless initialized-project mode AND `target_phase` is present.

Write the artifacts JSON to a temp file, then run:
```bash
MATERIALIZE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" intake materialize --artifacts-file "$ARTIFACTS_FILE")
if [[ "$MATERIALIZE" == @file:* ]]; then MATERIALIZE=$(cat "${MATERIALIZE#@file:}"); fi
```

Use the generated `{phase_dir}/{padded_phase}-INTAKE.md`.

If `next_action=trigger_plan_phase_prd`:
- verify the target phase has no existing `PLAN.md`
- dispatch:
```bash
SlashCommand("/gsdt:plan-phase ${TARGET_PHASE} --prd ${PHASE_BRIEF_PATH}")
```

If the target phase has no existing `PLAN.md`, continue normally.
If the target phase has existing plans, do not auto-dispatch.
</step>

<step name="report">
Show exactly one line.

Return a machine-readable block:
<intake_status>
已收纳 | project-ready=0.58 | next=collect_more
</intake_status>

Examples:
- `已收纳 | brief ready | next=trigger_new_project`
- `已收纳 | phase=2 conf=0.93 | next=trigger_plan_phase_prd`
- `已收纳 | phase=2 conf=0.82 existing-plans=yes | next=idle`
</step>

</process>
