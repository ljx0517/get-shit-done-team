---
name: gsdt:auto
description: One-click autopilot — auto capture, auto decide, auto advance
argument-hint: "<natural language idea or requirement>"
allowed-tools:
  - Read
  - Bash
  - SlashCommand
  - AskUserQuestion
---
<objective>
Single entrypoint for simplified usage.
User provides natural language only; workflow handles capture, decision, and auto-advance.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/auto.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the auto workflow from @~/.claude/gsdt/workflows/auto.md end-to-end.
</process>
