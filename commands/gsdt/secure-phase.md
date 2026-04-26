---
<<<<<<< HEAD:commands/gsdt/secure-phase.md
name: gsdt:secure-phase
=======
name: gsdt:secure-phase
>>>>>>> main:commands/gsd/secure-phase.md
description: Retroactively verify threat mitigations for a completed phase
argument-hint: "[phase number]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---
<objective>
Verify threat mitigations for a completed phase. Three states:
- (A) SECURITY.md exists — audit and verify mitigations
- (B) No SECURITY.md, PLAN.md with threat model exists — run from artifacts
- (C) Phase not executed — exit with guidance

Output: updated SECURITY.md.
</objective>

<execution_context>
<<<<<<< HEAD:commands/gsdt/secure-phase.md
@~/.claude/gsdt/workflows/secure-phase.md
=======
@~/.claude/get-shit-done/workflows/secure-phase.md
>>>>>>> main:commands/gsd/secure-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
<<<<<<< HEAD:commands/gsdt/secure-phase.md
Execute @~/.claude/gsdt/workflows/secure-phase.md.
=======
Execute @~/.claude/get-shit-done/workflows/secure-phase.md.
>>>>>>> main:commands/gsd/secure-phase.md
Preserve all workflow gates.
</process>
