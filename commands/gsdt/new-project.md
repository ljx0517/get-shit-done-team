---
name: gsdt:new-project
description: Initialize a new project with deep context gathering and PROJECT.md
argument-hint: "[--auto] [--in-place] [project name]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Flags:**
- `--auto` — Automatic mode. Reuses existing `.gsdt-planning/config.json` when present; otherwise asks config questions once, then runs research → requirements → roadmap without further interaction. Expects idea document via @ reference.
- `--in-place` — 在当前目录直接初始化项目，不创建子目录（兼容原有单项目模式）
- `project name` — 项目名称，默认会创建对应名称的子目录作为项目根
</context>

<objective>
Initialize a new project through unified flow: questioning → research (optional) → requirements → roadmap.

**Creates:**
- `.gsdt-planning/PROJECT.md` — project context
- `.gsdt-planning/config.json` — workflow preferences
- `.gsdt-planning/research/` — domain research (optional)
- `.gsdt-planning/REQUIREMENTS.md` — scoped requirements
- `.gsdt-planning/ROADMAP.md` — phase structure
- `.gsdt-planning/STATE.md` — project memory

**After this command:** Run `/gsdt:plan-phase 1` to start execution.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/new-project.md
@~/.claude/gsdt/references/questioning.md
@~/.claude/gsdt/references/ui-brand.md
@~/.claude/gsdt/templates/project.md
@~/.claude/gsdt/templates/requirements.md
</execution_context>

<process>
Execute the new-project workflow from @~/.claude/gsdt/workflows/new-project.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
