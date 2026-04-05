<purpose>
Draft intake cards and brief artifacts from the current semantic intake state.
</purpose>

<required_reading>
Read the invoking command plus current intake and planning state before writing artifact content.
</required_reading>

<process>

<step name="load_context">
Read these files if present:
- `.claude/.gsdt-intake/ledger.json`
- `.claude/.gsdt-intake/readiness.json`
- `.claude/.gsdt-intake/cards.md`
- `.claude/.gsdt-intake/brief.md`
- `.gsdt-planning/ROADMAP.md`
- `.gsdt-planning/STATE.md`
</step>

<step name="draft_artifacts">
Draft artifact content conservatively from the canonical intake state.

Requirements:
- `cards_markdown` should summarize canonical units grouped by semantic type
- `project_brief_markdown` should be strong enough to feed `new-project --auto`
- `phase_brief_markdown` should be strong enough to feed `plan-phase --prd`
- `one_line_status` must stay single-line and match the recommended route
- draft content only; deterministic CLI materialization will write the files

Return exactly one machine-readable block:
<intake_artifacts_json>
{
  "cards_markdown": "# Intake Cards\n...",
  "project_brief_markdown": "# Intake Brief\n...",
  "phase_brief_markdown": "# Phase Intake Brief\n...",
  "one_line_status": "已收纳 | phase=2 conf=0.93 | next=trigger_plan_phase_prd"
}
</intake_artifacts_json>
</step>

</process>
