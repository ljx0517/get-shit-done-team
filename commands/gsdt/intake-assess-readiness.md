---
name: gsdt:intake-assess-readiness
description: Assess semantic intake readiness and recommend the next intake action
argument-hint: "[optional-context]"
allowed-tools:
  - Read
  - Glob
  - Grep
---

<objective>
Assess semantic readiness for `/gsdt:intake` and recommend the next action.

This is an internal intake subskill.
- Recommend conservatively
- Separate project readiness from phase readiness
- Recommend routing, but do not enforce dispatch
</objective>

<execution_context>
@~/.claude/gsdt/workflows/intake-assess-readiness.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the intake-assess-readiness workflow end-to-end.
Return only the required `<intake_assessment_json>` block and no surrounding prose.
</process>
