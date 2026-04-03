# Assess Reviewer Registry

This file is a lightweight registry for Assess reviewer agents. The actual reviewer
prompts live in `agents/gsdt-*-reviewer.md`.

## Always-on reviewer agents

| Reviewer | Subagent Type | Agent File | Focus |
|----------|---------------|------------|-------|
| `correctness-reviewer` | `gsdt-correctness-reviewer` | `agents/gsdt-correctness-reviewer.md` | Logic correctness, contract mismatches, wrong state transitions |
| `testing-reviewer` | `gsdt-testing-reviewer` | `agents/gsdt-testing-reviewer.md` | Missing or weak tests, false-confidence assertions |
| `maintainability-reviewer` | `gsdt-maintainability-reviewer` | `agents/gsdt-maintainability-reviewer.md` | Duplication, hidden coupling, brittle abstractions |
| `project-standards-reviewer` | `gsdt-project-standards-reviewer` | `agents/gsdt-project-standards-reviewer.md` | `CLAUDE.md`, workflow conventions, portability |
| `learnings-researcher` | `gsdt-learnings-researcher` | `agents/gsdt-learnings-researcher.md` | Known patterns in `docs/solutions/` and compound learnings |

## Conditional reviewer agents

| Reviewer | Subagent Type | Agent File | Focus |
|----------|---------------|------------|-------|
| `security-reviewer` | `gsdt-security-reviewer` | `agents/gsdt-security-reviewer.md` | Auth, permissions, secrets, unsafe inputs |
| `performance-reviewer` | `gsdt-performance-reviewer` | `agents/gsdt-performance-reviewer.md` | Repeated work, expensive loops, large artifact processing |
| `reliability-reviewer` | `gsdt-reliability-reviewer` | `agents/gsdt-reliability-reviewer.md` | Retries, checkpoints, failure recovery, silent stalls |
| `cli-readiness-reviewer` | `gsdt-cli-readiness-reviewer` | `agents/gsdt-cli-readiness-reviewer.md` | Command handlers, argument parsing, machine-readable output |
| `ui-regression-reviewer` | `gsdt-ui-regression-reviewer` | `agents/gsdt-ui-regression-reviewer.md` | Loading/error/empty states and async UI regressions |
| `agent-surface-reviewer` | `gsdt-agent-surface-reviewer` | `agents/gsdt-agent-surface-reviewer.md` | Workflow/command/agent accessibility and automation gaps |

## Notes

- Use `gsdt/references/assess-persona-catalog.md` for selection rules.
- Use `gsdt/references/assess-subagent-template.md` for the shared spawn contract.
- Each reviewer must return JSON matching `gsdt/references/assess-findings-schema.json`.
