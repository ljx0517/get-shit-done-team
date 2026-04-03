# GSDT Compound YAML Schema

`compound.cjs` is the single writer for `docs/solutions/`.

## Frontmatter Rules

- `title`: short problem pattern name
- `date`: `YYYY-MM-DD`
- `problem_type`: one of the values from `compound-schema.yaml`
- `severity`: `critical | high | medium | low`
- `track`: `bug | knowledge`
- `source`: workflow source such as `diagnose-issues`, `debug`, or `post-commit`
- `phase`: optional phase identifier
- `files`: optional list of affected files
- `tags`: optional list of search tags
- `dedupe_key`: stable key used for idempotency and event upgrades
- `related`: optional list of related solution docs when overlap is moderate

## Bug Track Additions

- `symptoms`: list of observed symptoms
- `root_cause`: normalized root cause statement
- `resolution_type`: `code_fix | config_fix | test_fix | dependency_fix | data_fix`

## Automatic Mode Rules

- Background dispatch must not ask the user whether to reuse an existing solution.
- `candidate` events only persist to `.claude/.gsdt-planning/compound-events.json`.
- `diagnosed` and `resolved` events may write `docs/solutions/`, `.claude/.gsdt-planning/compound-memory.json`, and `.claude/.gsdt-planning/anti-patterns.md`.
- `post-commit` hook events may be promoted to `diagnosed` heuristically when the commit message includes clear root-cause clues.
- High-overlap matches update the existing doc in place.
- Moderate-overlap matches create a new doc and store the matched doc in `related`.
- Compound failures are recorded but must not block the parent workflow.

## Body Template Contract

Bug-track documents should keep this section order:

1. `## Context`
2. `## Problem`
3. `## Symptoms`
4. `## Root Cause`
5. `## Solution`
6. `## Why This Works` (optional)
7. `## Prevention`
8. `## Examples` (optional)
