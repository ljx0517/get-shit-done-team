# Assess Diff Scope

Assess is phase-scoped, not PR-scoped.

## Scope tiers

### Primary

Treat the issue as `primary` when it is directly inside:

- files changed by the current phase
- tests added or modified by the current phase
- phase artifacts that make claims about implementation, such as `*-SUMMARY.md` and `*-VERIFICATION.md`
- code paths explicitly touched by the phase goal or requirement IDs

Primary findings are the default.

### Secondary

Treat the issue as `secondary` when the current phase did not directly edit the line, but the phase made that adjacent path newly risky or newly incorrect.

Examples:

- the phase changed call sites but left a newly invalid helper untouched
- the phase changed data shape assumptions and an adjacent serializer now breaks
- the phase introduced a new race window in an existing async path

Secondary findings are valid, but they must explain why the current phase made them relevant now.

### Pre-existing

Treat the issue as `pre_existing` only when all of the following are true:

- the code is unchanged by this phase
- the current phase does not make the issue newly relevant
- the issue is unrelated to the phase goal, requirements, or verification claims

Pre-existing findings are report-only and must not block completion by themselves.

## Evidence expectations

- Cite actual files or artifacts in scope.
- If using a phase artifact as evidence, tie it back to code or tests.
- Do not flag broad cleanup work without a concrete failure mode.

## Intent sources

When intent is ambiguous, infer in this order:

1. `ROADMAP.md` phase goal and success criteria
2. `REQUIREMENTS.md` IDs mapped to the phase
3. `*-VERIFICATION.md` must-haves and gaps
4. `*-SUMMARY.md`
5. `*-CONTEXT.md`

Do not ask the user during Assess.
