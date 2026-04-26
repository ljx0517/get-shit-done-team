---
<<<<<<< HEAD:commands/gsdt/scan.md
name: gsdt:scan
description: Rapid codebase assessment — lightweight alternative to /gsdt-map-codebase
=======
name: gsdt:scan
description: Rapid codebase assessment — lightweight alternative to /gsd-map-codebase
>>>>>>> main:commands/gsd/scan.md
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
---
<objective>
<<<<<<< HEAD:commands/gsdt/scan.md
Run a focused codebase scan for a single area, producing targeted documents in `.gsdt-planning/codebase/`.
Accepts an optional `--focus` flag: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default).

Lightweight alternative to `/gsdt-map-codebase` — spawns one mapper agent instead of four parallel ones.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/scan.md
</execution_context>

<process>
Execute the scan workflow from @~/.claude/gsdt/workflows/scan.md end-to-end.
=======
Run a focused codebase scan for a single area, producing targeted documents in `.planning/codebase/`.
Accepts an optional `--focus` flag: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default).

Lightweight alternative to `/gsd-map-codebase` — spawns one mapper agent instead of four parallel ones.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/scan.md
</execution_context>

<process>
Execute the scan workflow from @~/.claude/get-shit-done/workflows/scan.md end-to-end.
>>>>>>> main:commands/gsd/scan.md
</process>
