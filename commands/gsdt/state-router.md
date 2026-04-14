---
name: gsdt:state-router
description: State-first GSDT router — outputs JSON only (next slash command)
argument-hint: "<natural language> [key=value state flags]"
allowed-tools:
  - Read
---

<objective>
Machine-readable routing only. Given natural language plus optional `key=value` state flags, return **one JSON object** — no prose, no markdown fences — so Claude Code and scripts can parse the next `/gsdt:*` step without ambiguity.
</objective>

<execution_context>
@gsdt/workflows/flow-router.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute **only** the workflow in `@gsdt/workflows/flow-router.md`.
Obey its `<output_contract>`: the assistant’s **entire** reply must be a single JSON object and nothing else.
</process>
