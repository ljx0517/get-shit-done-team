---
<<<<<<< HEAD:commands/gsdt/undo.md
name: gsdt:undo
=======
name: gsdt:undo
>>>>>>> main:commands/gsd/undo.md
description: "Safe git revert. Roll back phase or plan commits using the phase manifest with dependency checks."
argument-hint: "--last N | --phase NN | --plan NN-MM"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Safe git revert — roll back GSD phase or plan commits using the phase manifest, with dependency checks and a confirmation gate before execution.

Three modes:
- **--last N**: Show recent GSD commits for interactive selection
- **--phase NN**: Revert all commits for a phase (manifest + git log fallback)
- **--plan NN-MM**: Revert all commits for a specific plan
</objective>

<execution_context>
<<<<<<< HEAD:commands/gsdt/undo.md
@~/.claude/gsdt/workflows/undo.md
@~/.claude/gsdt/references/ui-brand.md
@~/.claude/gsdt/references/gate-prompts.md
=======
@~/.claude/get-shit-done/workflows/undo.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/references/gate-prompts.md
>>>>>>> main:commands/gsd/undo.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
<<<<<<< HEAD:commands/gsdt/undo.md
Execute the undo workflow from @~/.claude/gsdt/workflows/undo.md end-to-end.
=======
Execute the undo workflow from @~/.claude/get-shit-done/workflows/undo.md end-to-end.
>>>>>>> main:commands/gsd/undo.md
</process>
