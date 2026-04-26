---
<<<<<<< HEAD:commands/gsdt/ai-integration-phase.md
name: gsdt:ai-integration-phase
=======
name: gsdt:ai-integration-phase
>>>>>>> main:commands/gsd/ai-integration-phase.md
description: Generate AI design contract (AI-SPEC.md) for phases that involve building AI systems — framework selection, implementation guidance from official docs, and evaluation strategy
argument-hint: "[phase number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
---
<objective>
Create an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrates gsd-framework-selector → gsd-ai-researcher → gsd-domain-researcher → gsd-eval-planner.
Flow: Select Framework → Research Docs → Research Domain → Design Eval Strategy → Done
</objective>

<execution_context>
<<<<<<< HEAD:commands/gsdt/ai-integration-phase.md
@~/.claude/gsdt/workflows/ai-integration-phase.md
@~/.claude/gsdt/references/ai-frameworks.md
@~/.claude/gsdt/references/ai-evals.md
=======
@~/.claude/get-shit-done/workflows/ai-integration-phase.md
@~/.claude/get-shit-done/references/ai-frameworks.md
@~/.claude/get-shit-done/references/ai-evals.md
>>>>>>> main:commands/gsd/ai-integration-phase.md
</execution_context>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
<<<<<<< HEAD:commands/gsdt/ai-integration-phase.md
Execute @~/.claude/gsdt/workflows/ai-integration-phase.md end-to-end.
=======
Execute @~/.claude/get-shit-done/workflows/ai-integration-phase.md end-to-end.
>>>>>>> main:commands/gsd/ai-integration-phase.md
Preserve all workflow gates.
</process>
