---
name: gsdt:capture
description: Capture freeform project ideas and infer functionality graph
argument-hint: "<text>"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

<objective>
Capture a freeform fragment of project ideas. Allow gaps — do not require closure.
Automatically infer missing functionality, update the feature graph, and check
whether enough fragments have accumulated to support a milestone.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/capture.md
</execution_context>

<context>
Fragment input: $ARGUMENTS
</context>
