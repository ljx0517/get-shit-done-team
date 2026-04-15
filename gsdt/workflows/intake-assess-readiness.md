<purpose>
Assess semantic intake readiness and recommend the next routing action.
</purpose>

<required_reading>
Read the invoking command plus current intake and planning state before deciding.
</required_reading>

<process>

<step name="load_context">
Read these files if present:
- `.claude/.gsdt-intake/ledger.json`
- `.claude/.gsdt-intake/readiness.json`
- `.gsdt-planning/ROADMAP.md`
- `.gsdt-planning/STATE.md`
</step>

<step name="assess_readiness">
Recommend the next action semantically.

Rules:
- prefer `collect_more` over premature promotion
- prefer `idle` over routing into a phase with weak evidence
- treat backlog or future work separately from current-phase work
- separate project-level readiness from phase-level readiness
- recommend routing, but do not enforce dispatch; deterministic CLI guards will decide the final safe action

Cold-start optimization:
- If project description contains "核心功能 + 平台/技术约束 + 至少一个可推断使用场景", score should reflect project_ready_score ≥ 0.7
- For meta-questions (e.g., "还需补充什么"), if description is already sufficient, recommend "trigger_new_project" instead of "collect_more"
- Absence of GSDT state files alone should not trigger "information insufficient" — evaluate description density instead

Return exactly one machine-readable block:
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

</process>
