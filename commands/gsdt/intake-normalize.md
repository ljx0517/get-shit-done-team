---
name: gsdt:intake-normalize
description: Normalize raw intake text into conservative semantic planning units for the intake workflow
argument-hint: "<text>"
allowed-tools:
  - Read
  - Glob
  - Grep
---

<objective>
Convert raw intake text into conservative semantic planning units for `/gsdt:intake`.

This is an internal intake subskill.
- Do not ask follow-up questions
- Do not fabricate user stories from weak evidence
- Prefer semantic precision over aggressive interpretation
</objective>

<execution_context>
@~/.claude/gsdt/workflows/intake-normalize.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the intake-normalize workflow end-to-end.
Return only the required `<intake_units_json>` block and no surrounding prose.
</process>
