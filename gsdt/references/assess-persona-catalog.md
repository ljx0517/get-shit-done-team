# Assess Persona Catalog

Assess uses a compact reviewer set tuned for GSDT's workflow/tooling codebase.

## Always-on reviewers

These reviewers run on every Assess pass.

| Reviewer | Subagent Type | Agent File | Focus |
|----------|---------------|------------|-------|
| `correctness-reviewer` | `gsdt-correctness-reviewer` | `agents/gsdt-correctness-reviewer.md` | Logic correctness, contract mismatches, wrong state transitions, missing edge-case handling |
| `testing-reviewer` | `gsdt-testing-reviewer` | `agents/gsdt-testing-reviewer.md` | Missing or weak tests, false-confidence assertions, unverified branches |
| `maintainability-reviewer` | `gsdt-maintainability-reviewer` | `agents/gsdt-maintainability-reviewer.md` | Complexity, duplication, hidden coupling, brittle abstractions |
| `project-standards-reviewer` | `gsdt-project-standards-reviewer` | `agents/gsdt-project-standards-reviewer.md` | `CLAUDE.md`, workflow conventions, portability, artifact discipline |
| `learnings-researcher` | `gsdt-learnings-researcher` | `agents/gsdt-learnings-researcher.md` | Similar known patterns in `docs/solutions/` and reusable compound learnings |

## Conditional reviewers

These are selected automatically from changed files and phase intent.

| Reviewer | Subagent Type | Agent File | Select when the phase touches... |
|----------|---------------|------------|----------------------------------|
| `security-reviewer` | `gsdt-security-reviewer` | `agents/gsdt-security-reviewer.md` | auth, permissions, public surfaces, user-controlled input, secrets |
| `performance-reviewer` | `gsdt-performance-reviewer` | `agents/gsdt-performance-reviewer.md` | queries, loops, caching, background work, expensive transforms |
| `reliability-reviewer` | `gsdt-reliability-reviewer` | `agents/gsdt-reliability-reviewer.md` | retries, error handling, async workflows, checkpoints, resumability |
| `cli-readiness-reviewer` | `gsdt-cli-readiness-reviewer` | `agents/gsdt-cli-readiness-reviewer.md` | command handlers, argument parsing, CLI entrypoints, workflow dispatch |
| `ui-regression-reviewer` | `gsdt-ui-regression-reviewer` | `agents/gsdt-ui-regression-reviewer.md` | UI states, async UX, wording, loading/error/empty states |
| `agent-surface-reviewer` | `gsdt-agent-surface-reviewer` | `agents/gsdt-agent-surface-reviewer.md` | whether the feature is usable through workflows, commands, or agent paths |

## Selection heuristics

- Add `gsdt-cli-readiness-reviewer` when changed files touch `commands/`, `gsdt/bin/`, CLI parsing, workflow dispatch, or machine-readable output paths.
- Add `gsdt-agent-surface-reviewer` when changed files touch `agents/`, `gsdt/workflows/`, command entrypoints, or code that would otherwise force manual human steps.
- Add `gsdt-reliability-reviewer` when the phase changes retries, resumability, checkpoints, background loops, or failure recovery.
- Add `gsdt-security-reviewer` when the phase touches auth, permissions, secrets, shell execution, external requests, or user-controlled inputs.
- Add `gsdt-performance-reviewer` when the phase adds repeated work, scans, expensive loops, large artifact processing, or repeated tool invocations.
- Add `gsdt-ui-regression-reviewer` when the phase changes UI strings, visual states, async UX, or feedback shown to the user.

## Selection rules

1. Always run all always-on reviewers.
2. Add conditional reviewers conservatively based on changed files, verification claims, and phase goal.
3. Prefer fewer high-signal reviewers over a large noisy swarm.
4. If selection is ambiguous, include the reviewer and record the reason in Coverage instead of asking the user.
5. Assess remains `internal_auto`: reviewer selection must never block on human choice.
