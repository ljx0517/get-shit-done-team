---
name: gsdt:cleanup
description: Archive accumulated phase directories from completed milestones
---
<objective>
Archive phase directories from completed milestones into `.claude/.gsdt-planning/milestones/v{X.Y}-phases/`.

Use when `.claude/.gsdt-planning/phases/` has accumulated directories from past milestones.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/cleanup.md
</execution_context>

<process>
Follow the cleanup workflow at @~/.claude/gsdt/workflows/cleanup.md.
Identify completed milestones, show a dry-run summary, and archive on confirmation.
</process>
