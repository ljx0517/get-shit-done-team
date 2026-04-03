---
name: gsdt:intake-resolve-units
description: Resolve duplicate, conflicting, and canonical intake units for the intake workflow
argument-hint: "[@units-json-file]"
allowed-tools:
  - Read
  - Glob
  - Grep
---

<objective>
Resolve semantic duplicates and conflicts across intake units for `/gsdt:intake`.

This is an internal intake subskill.
- Prefer updating a canonical unit over creating near-duplicates
- Preserve explicit conflicts instead of averaging them away
- Return a conservative semantic resolution
</objective>

<execution_context>
@~/.claude/gsdt/workflows/intake-resolve-units.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the intake-resolve-units workflow end-to-end.
Return only the required `<intake_resolution_json>` block and no surrounding prose.
</process>
