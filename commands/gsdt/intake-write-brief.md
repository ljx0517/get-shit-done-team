---
name: gsdt:intake-write-brief
description: Draft intake cards and brief artifacts from the current semantic intake state
argument-hint: "[optional-context]"
allowed-tools:
  - Read
  - Glob
  - Grep
---

<objective>
Draft intake artifact content for `/gsdt:intake`.

This is an internal intake subskill.
- Summarize the current semantic intake state clearly
- Produce markdown that is ready for deterministic materialization
- Keep the final status line to a single line
</objective>

<execution_context>
@~/.claude/gsdt/workflows/intake-write-brief.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the intake-write-brief workflow end-to-end.
Return only the required `<intake_artifacts_json>` block and no surrounding prose.
</process>
