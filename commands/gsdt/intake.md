---
name: gsdt:intake
description: Quiet semantic intake for freeform ideas, constraints, and project updates
argument-hint: "<text>"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - SlashCommand
---

<objective>
Quiet semantic intake for freeform ideas, constraints, and project updates.

This command is semantic-first, not graph-first.
It is designed for low interruption:
- no questions by default
- one-line status output
- automatic promotion only when confidence is high

Cold start:
- accumulate semantic units
- generate `.claude/.gsdt-intake/brief.md` when mature
- auto-trigger `/gsdt:new-project --auto @.claude/.gsdt-intake/brief.md` only when readiness is high

Initialized project:
- map input to project-level or phase-level planning units
- generate phase brief when a phase match is confident
- auto-trigger `/gsdt:plan-phase N --prd <phase-brief>` only when confidence is high and the target phase has no existing plans

Never force the user to write formal requirements or formal user stories.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/intake.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the intake workflow end-to-end.
Delegate semantic normalization, resolution, readiness assessment, and brief drafting to dedicated `gsdt:intake-*` subskills, then persist intake memory, apply deterministic guards, materialize artifacts, and route only when safe.
</process>
