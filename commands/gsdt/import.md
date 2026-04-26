---
<<<<<<< HEAD:commands/gsdt/import.md
name: gsdt:import
=======
name: gsdt:import
>>>>>>> main:commands/gsd/import.md
description: Ingest external plans with conflict detection against project decisions before writing anything.
argument-hint: "--from <filepath>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Import external plan files into the GSD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as GSD PLAN.md, validate via gsd-plan-checker.

Future: `--prd` mode for PRD extraction is planned for a follow-up PR.
</objective>

<execution_context>
<<<<<<< HEAD:commands/gsdt/import.md
@~/.claude/gsdt/workflows/import.md
@~/.claude/gsdt/references/ui-brand.md
@~/.claude/gsdt/references/gate-prompts.md
=======
@~/.claude/get-shit-done/workflows/import.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/references/gate-prompts.md
@~/.claude/get-shit-done/references/doc-conflict-engine.md
>>>>>>> main:commands/gsd/import.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the import workflow end-to-end.
</process>
