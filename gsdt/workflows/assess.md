---
name: assess
description: Internal assess loop for phase-scoped review closure
---

# Assess Workflow

Assess is the internal quality-closure loop that runs after verification passes and before
the phase is marked complete. It is phase-scoped, `internal_auto`, and optimized to avoid
user interruption.

## Principles

- Keep scope limited to the current phase, its changed code, and its generated artifacts
- Default to `internal_auto`
- Never ask the user to classify findings inside Assess
- Only auto-fix `safe_auto -> review-fixer`
- Route unresolved actionable work back into existing `gap_closure`
- Feed resolved patterns into `compound dispatch`

## Prompt Architecture

Assess uses three prompt layers:

1. Orchestrator prompt: this file
2. Reviewer spawn contract: `gsdt/references/assess-subagent-template.md`
3. Reviewer catalog and prompts:
   - `gsdt/references/assess-persona-catalog.md`
   - `gsdt/references/assess-reviewers.md`

This borrows the plugin's control structure, but remains GSDT-native:
phase-scoped instead of PR-scoped, no GitHub review threads, and no new `/gsdt:*` entrypoints.

<available_agent_types>
- gsdt-correctness-reviewer
- gsdt-testing-reviewer
- gsdt-maintainability-reviewer
- gsdt-project-standards-reviewer
- gsdt-learnings-researcher
- gsdt-security-reviewer
- gsdt-performance-reviewer
- gsdt-reliability-reviewer
- gsdt-cli-readiness-reviewer
- gsdt-ui-regression-reviewer
- gsdt-agent-surface-reviewer
- gsdt-review-fixer
</available_agent_types>

## Stage 1: Gather phase context

Collect these inputs automatically:

- phase metadata from `init phase-op`
- phase goal and success criteria from `ROADMAP.md`
- requirement IDs from `REQUIREMENTS.md`
- `*-VERIFICATION.md`
- `*-SUMMARY.md`
- `*-CONTEXT.md` if present
- relevant changed files and local diff for the current phase

Initialize phase context and agent skill blocks once before reviewer selection:

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" init phase-op "${PHASE_NUMBER}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_CORRECTNESS=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-correctness-reviewer 2>/dev/null)
AGENT_SKILLS_TESTING=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-testing-reviewer 2>/dev/null)
AGENT_SKILLS_MAINTAINABILITY=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-maintainability-reviewer 2>/dev/null)
AGENT_SKILLS_PROJECT_STANDARDS=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-project-standards-reviewer 2>/dev/null)
AGENT_SKILLS_LEARNINGS=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-learnings-researcher 2>/dev/null)
AGENT_SKILLS_SECURITY=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-security-reviewer 2>/dev/null)
AGENT_SKILLS_PERFORMANCE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-performance-reviewer 2>/dev/null)
AGENT_SKILLS_RELIABILITY=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-reliability-reviewer 2>/dev/null)
AGENT_SKILLS_CLI_READINESS=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-cli-readiness-reviewer 2>/dev/null)
AGENT_SKILLS_UI_REGRESSION=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-ui-regression-reviewer 2>/dev/null)
AGENT_SKILLS_AGENT_SURFACE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-agent-surface-reviewer 2>/dev/null)
AGENT_SKILLS_REVIEW_FIXER=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-review-fixer 2>/dev/null)
```

If context is incomplete, continue in degraded mode and record the missing inputs in Coverage.
Do not ask the user.

## Stage 2: Infer intent

Build a compact 2-3 line intent summary from:

1. phase goal
2. must-haves and gaps from verification
3. phase summaries
4. user decisions from context

When these sources conflict, prefer `ROADMAP.md` plus `VERIFICATION.md`.
If intent remains ambiguous, infer conservatively and note the ambiguity in Coverage instead of blocking.

## Stage 3: Select reviewers

Use `gsdt/references/assess-persona-catalog.md`.

Always-on reviewers:

- `correctness-reviewer`
- `testing-reviewer`
- `maintainability-reviewer`
- `project-standards-reviewer`
- `learnings-researcher`

Conditional reviewers are chosen automatically from changed files, diff patterns, and phase goal:

- `security-reviewer`
- `performance-reviewer`
- `reliability-reviewer`
- `cli-readiness-reviewer`
- `ui-regression-reviewer`
- `agent-surface-reviewer`

No user confirmation is required for reviewer selection.

Derive the concrete subagent list from the catalog:

- `correctness-reviewer` -> `gsdt-correctness-reviewer`
- `testing-reviewer` -> `gsdt-testing-reviewer`
- `maintainability-reviewer` -> `gsdt-maintainability-reviewer`
- `project-standards-reviewer` -> `gsdt-project-standards-reviewer`
- `learnings-researcher` -> `gsdt-learnings-researcher`
- `security-reviewer` -> `gsdt-security-reviewer`
- `performance-reviewer` -> `gsdt-performance-reviewer`
- `reliability-reviewer` -> `gsdt-reliability-reviewer`
- `cli-readiness-reviewer` -> `gsdt-cli-readiness-reviewer`
- `ui-regression-reviewer` -> `gsdt-ui-regression-reviewer`
- `agent-surface-reviewer` -> `gsdt-agent-surface-reviewer`

## Stage 3b: Discover standards paths

Before spawning `gsdt-project-standards-reviewer`, discover relevant standards file paths.
Pass paths, not full contents:

- root `CLAUDE.md` when present
- any ancestor `CLAUDE.md` or `AGENTS.md` that governs changed files

The reviewer reads those files itself. Do not inline large standards documents in the orchestrator prompt.

## Stage 4: Spawn reviewers in parallel

Spawn one `Task()` per selected reviewer in parallel. All `Task()` calls must be issued together.

Always-on example:

```
Task(
  prompt="<files_to_read>
{phase_artifact_paths}
</files_to_read>

<review-template>
Use gsdt/references/assess-subagent-template.md.
</review-template>

<standards-paths>
{relevant standards paths for project-standards only}
</standards-paths>
${AGENT_SKILLS_CORRECTNESS}",
  subagent_type="gsdt-correctness-reviewer",
  description="Correctness review"
)

Task(
  prompt="{same assess review context}
${AGENT_SKILLS_TESTING}",
  subagent_type="gsdt-testing-reviewer",
  description="Testing review"
)

Task(
  prompt="{same assess review context}
${AGENT_SKILLS_MAINTAINABILITY}",
  subagent_type="gsdt-maintainability-reviewer",
  description="Maintainability review"
)

Task(
  prompt="{same assess review context plus <standards-paths>}
${AGENT_SKILLS_PROJECT_STANDARDS}",
  subagent_type="gsdt-project-standards-reviewer",
  description="Standards review"
)

Task(
  prompt="{same assess review context}
${AGENT_SKILLS_LEARNINGS}",
  subagent_type="gsdt-learnings-researcher",
  description="Known patterns review"
)
```

For conditionally selected reviewers, repeat the same `Task()` pattern with:

- `subagent_type="gsdt-security-reviewer"` + `${AGENT_SKILLS_SECURITY}`
- `subagent_type="gsdt-performance-reviewer"` + `${AGENT_SKILLS_PERFORMANCE}`
- `subagent_type="gsdt-reliability-reviewer"` + `${AGENT_SKILLS_RELIABILITY}`
- `subagent_type="gsdt-cli-readiness-reviewer"` + `${AGENT_SKILLS_CLI_READINESS}`
- `subagent_type="gsdt-ui-regression-reviewer"` + `${AGENT_SKILLS_UI_REGRESSION}`
- `subagent_type="gsdt-agent-surface-reviewer"` + `${AGENT_SKILLS_AGENT_SURFACE}`

Shared context for every reviewer:

- `gsdt/references/assess-diff-scope.md`
- `gsdt/references/assess-findings-schema.json`
- phase goal, requirements summary, verification summary, summaries, changed files, and diff

Reviewer outputs must be JSON only and must conform to the Assess findings schema.
Write the merged reviewer result array to `$ASSESS_REVIEWERS_JSON`.

## Stage 5: Merge and classify

Run:

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review assess \
  --phase "$PHASE_NUMBER" \
  --mode internal_auto \
  --json \
  --reviewer-output-file "$ASSESS_REVIEWERS_JSON"
```

This step must:

- validate reviewer outputs against schema
- dedupe duplicate findings
- boost confidence on reviewer agreement
- suppress low-confidence noise
- conservatively route disagreement
- separate `safe_auto`, blocking findings, and report-only findings
- write `{phase_dir}/{phase_num}-ASSESS.md`
- write `{phase_dir}/{phase_num}-ASSESS.json`

## Stage 6: Safe auto-fix pass

If the merged result has `safe_auto -> review-fixer` findings:

- spawn a single fixer task:

```
Task(
  prompt="<files_to_read>
{safe_auto_target_files}
</files_to_read>

<assess-findings>
{safe_auto findings only}
</assess-findings>
${AGENT_SKILLS_REVIEW_FIXER}",
  subagent_type="gsdt-review-fixer",
  description="Apply safe assess fixes"
)
```

- run a single fixer pass first
- allow at most 2 bounded review/fix rounds total
- never widen auto-fix scope beyond `safe_auto`
- if a finding has `requires_verification: true`, targeted verification is mandatory before considering it resolved

If there are no auto-fixable findings, skip this stage silently.

## Stage 7: Final routing

Routing rules:

- `safe_auto` -> review-fixer pass
- `gated_auto` -> blocking assess gap
- `manual` -> blocking assess gap
- `advisory` -> report only
- `pre_existing` or `scope_tier: pre_existing` -> report only

Verdicts:

- `clean`: no remaining findings
- `auto_fixed`: safe fixes were applied and revalidated
- `blocking_findings`: remaining findings must enter `gap_closure`
- `degraded`: reviewer output or evidence was incomplete

## Output Contract

- Final artifact shape: `gsdt/references/assess-output-template.md`
- Full synthesized format: `gsdt/references/assess-review-output-template.md`
- Markdown report: `{phase_dir}/{phase_num}-ASSESS.md`
- JSON report: `{phase_dir}/{phase_num}-ASSESS.json`
- Blocking findings are normalized into assess gaps for existing `gap_closure`
- Resolved findings are emitted to `compound dispatch` with `source: assess`

## Automation Rules

- Do not use interactive question tools
- Do not pause for reviewer selection
- Do not pause for intent clarification
- Do not create a new user-facing workflow entrypoint
- Do not auto-apply `gated_auto` or `manual` findings

## Non-Goals

- Do not widen scope to full-branch review
- Do not replicate plugin PR review mechanics
- Do not duplicate `verify-work` or `ui-review`
