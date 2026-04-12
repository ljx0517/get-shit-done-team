---
name: gsdt:scan
description: Rapid codebase assessment — lightweight alternative to /gsdt-map-codebase
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
Run a focused codebase scan for a single area, producing targeted documents in `.gsdt-planning/codebase/`.
Accepts an optional `--focus` flag: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default).

Lightweight alternative to `/gsdt-map-codebase` — spawns one mapper agent instead of four parallel ones.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/scan.md
</execution_context>

<process>
Execute the scan workflow from @~/.claude/gsdt/workflows/scan.md end-to-end.
</process>
