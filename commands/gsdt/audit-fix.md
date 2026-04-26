---
type: prompt
<<<<<<< HEAD:commands/gsdt/audit-fix.md
name: gsdt:audit-fix
=======
name: gsdt:audit-fix
>>>>>>> main:commands/gsd/audit-fix.md
description: Autonomous audit-to-fix pipeline — find issues, classify, fix, test, commit
argument-hint: "--source <audit-uat> [--severity <medium|high|all>] [--max N] [--dry-run]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - Agent
  - AskUserQuestion
---
<objective>
Run an audit, classify findings as auto-fixable vs manual-only, then autonomously fix
auto-fixable issues with test verification and atomic commits.

Flags:
- `--max N` — maximum findings to fix (default: 5)
- `--severity high|medium|all` — minimum severity to process (default: medium)
- `--dry-run` — classify findings without fixing (shows classification table)
- `--source <audit>` — which audit to run (default: audit-uat)
</objective>

<execution_context>
<<<<<<< HEAD:commands/gsdt/audit-fix.md
@~/.claude/gsdt/workflows/audit-fix.md
</execution_context>

<process>
Execute the audit-fix workflow from @~/.claude/gsdt/workflows/audit-fix.md end-to-end.
=======
@~/.claude/get-shit-done/workflows/audit-fix.md
</execution_context>

<process>
Execute the audit-fix workflow from @~/.claude/get-shit-done/workflows/audit-fix.md end-to-end.
>>>>>>> main:commands/gsd/audit-fix.md
</process>
