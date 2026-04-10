# GSDT Workflow Reference

> Internal workflow inventory for `gsdt/workflows/*.md`. These workflows are the orchestration layer behind slash commands, inline command prompts, and automation chains.

## What Counts As A Workflow

GSDT has four callable surfaces:

| Surface | Location | Who calls it | What it does |
|---------|----------|--------------|--------------|
| Commands | `commands/gsdt/*.md` | Users | User-facing entrypoints such as `/gsdt:plan-phase` |
| Workflows | `gsdt/workflows/*.md` | Commands, other workflows | Orchestration logic, routing, and state transitions |
| Agents | `agents/*.md` | Workflows | Fresh-context specialized workers |
| CLI Tools | `gsdt/bin/gsdt-tools.cjs` | Workflows, agents, scripts | Deterministic programmatic operations |

Current repository-local workflow inventory: `66` workflow files.

## Notes On Skills

This repository currently has **no repo-local `SKILL.md` packages**.

In practice, GSDT's capability model is:

- Commands for user-facing entrypoints
- Workflows for orchestration
- Agents for specialized execution
- `gsdt-tools.cjs` for deterministic internal commands

External project skills can still be injected into supported agents through `config.agent_skills` and `node gsdt-tools.cjs agent-skills <agent-type>`.

## Project, Milestone, And Workspace Workflows

| Workflow | Triggered by | Main purpose | Typical agents | Main outputs / side effects |
|---------|--------------|--------------|----------------|-----------------------------|
| `new-project` | `/gsdt:new-project` | Initialize project from idea to roadmap | `gsdt-project-researcher`, `gsdt-research-synthesizer`, `gsdt-roadmapper` | `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`, project research files |
| `new-milestone` | `/gsdt:new-milestone` | Start the next milestone cycle | `gsdt-project-researcher`, `gsdt-research-synthesizer`, `gsdt-roadmapper` | Updated `PROJECT.md`, fresh `REQUIREMENTS.md`, new `ROADMAP.md`, reset `STATE.md`, optional research refresh |
| `complete-milestone` | `/gsdt:complete-milestone` | Archive a completed milestone and tag release | None | `MILESTONES.md`, archived roadmap/requirements files, updated `PROJECT.md`, git tag |
| `milestone-summary` | `/gsdt:milestone-summary` | Summarize a milestone for onboarding and review | None | `reports/MILESTONE_SUMMARY-v{version}.md` |
| `audit-milestone` | `/gsdt:audit-milestone` | Check milestone definition-of-done and cross-phase integration | `gsdt-integration-checker` | `v{version}-MILESTONE-AUDIT.md` |
| `plan-milestone-gaps` | `/gsdt:plan-milestone-gaps` | Convert audit gaps into new roadmap phases | None | Updated `ROADMAP.md`, new gap phases |
| `new-workspace` | `/gsdt:new-workspace` | Create isolated workspaces and repo copies | None | `WORKSPACE.md`, isolated `.gsdt-planning/`, worktree/clone setup |
| `list-workspaces` | `/gsdt:list-workspaces` | List active GSDT workspaces | None | Human-readable workspace status output |
| `remove-workspace` | `/gsdt:remove-workspace` | Remove a workspace and clean up git artifacts | None | Workspace deletion, worktree cleanup |
| `cleanup` | `/gsdt:cleanup` | Archive old phase directories from completed milestones | None | `.gsdt-planning/milestones/vX.Y-phases/` |
| `map-codebase` | `/gsdt:map-codebase` | Analyze an existing codebase in parallel | `gsdt-codebase-mapper` | `.gsdt-planning/codebase/*.md` |

## Phase Discovery, Discussion, And Planning Workflows

| Workflow | Triggered by | Main purpose | Typical agents | Main outputs / side effects |
|---------|--------------|--------------|----------------|-----------------------------|
| `discuss-phase` | `/gsdt:discuss-phase` | Gather phase decisions through discussion | Optional `general-purpose` advisor research path | `{phase}-CONTEXT.md`, `{phase}-DISCUSSION-LOG.md` |
| `discuss-phase-assumptions` | `/gsdt:discuss-phase` when assumptions mode is enabled | Gather phase decisions via codebase-first assumptions analysis | `gsdt-assumptions-analyzer`, optional `general-purpose` research | `{phase}-CONTEXT.md`, assumptions-backed discussion log |
| `list-phase-assumptions` | `/gsdt:list-phase-assumptions` | Show likely implementation assumptions before planning | None | Inline assumptions preview |
| `ui-phase` | `/gsdt:ui-phase` | Create UI design contract before planning frontend work | `gsdt-ui-researcher`, `gsdt-ui-checker` | `{phase}-UI-SPEC.md` |
| `research-phase` | `/gsdt:research-phase` | Run standalone phase research without planning | `gsdt-phase-researcher` | `{phase}-RESEARCH.md` |
| `plan-phase` | `/gsdt:plan-phase` | Produce executable phase plans with research and verification | `gsdt-phase-researcher`, `gsdt-planner`, `gsdt-plan-checker` | `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`, `{phase}-VALIDATION.md` |
| `add-phase` | `/gsdt:add-phase` | Append a new integer phase to the roadmap | None | Updated `ROADMAP.md`, new phase directory |
| `insert-phase` | `/gsdt:insert-phase` | Insert a decimal phase for urgent work | None | Updated `ROADMAP.md`, new decimal phase directory |
| `remove-phase` | `/gsdt:remove-phase` | Remove a future phase and renumber following phases | None | Updated `ROADMAP.md`, deleted or renumbered phase directories |
| `discovery-phase` | Internal automation | Run discovery at the appropriate depth | None | Internal discovery handoff or context refinement |

## Execution, Verification, And Quality Workflows

| Workflow | Triggered by | Main purpose | Typical agents | Main outputs / side effects |
|---------|--------------|--------------|----------------|-----------------------------|
| `execute-phase` | `/gsdt:execute-phase` | Orchestrate plan execution by dependency wave | `gsdt-executor`, `gsdt-verifier`, assess reviewer family, `gsdt-review-fixer` | Per-plan `SUMMARY.md`, phase `VERIFICATION.md`, `ASSESS.md/json`, git commits, roadmap/state updates |
| `execute-plan` | `execute-phase`, `quick` | Execute a single `PLAN.md` | `gsdt-executor` | Single-plan `SUMMARY.md`, task-level commits |
| `verify-phase` | `execute-phase` | Verify that a phase achieved its goal | `gsdt-verifier` | `{phase}-VERIFICATION.md` |
| `verify-work` | `/gsdt:verify-work` | Run conversational UAT with persistent state | `gsdt-debugger`, `gsdt-planner`, `gsdt-plan-checker` | `{phase}-UAT.md`, gap diagnoses, verified fix plans |
| `diagnose-issues` | `verify-work` | Parallel root-cause diagnosis for UAT gaps | `gsdt-debugger` | Updated UAT gaps, debug session files |
| `assess` | `execute-phase` | Automatic phase-scoped review after verification | Assess reviewer family, `gsdt-review-fixer` | `{phase}-ASSESS.md`, `{phase}-ASSESS.json` |
| `transition` | `execute-phase` auto-advance | Route to the next workflow step after a phase completes | None | Internal chain transition, next-command routing |
| `add-tests` | `/gsdt:add-tests` | Generate tests for completed work | None fixed; may use existing project tooling | Test files, optional validation updates |
| `validate-phase` | `/gsdt:validate-phase` | Fill Nyquist test gaps retroactively | `gsdt-nyquist-auditor` | Test files, updated `VALIDATION.md` |
| `ui-review` | `/gsdt:ui-review` | Run retroactive UI audit | `gsdt-ui-auditor` | `{phase}-UI-REVIEW.md`, screenshots |
| `node-repair` | `execute-plan` on task verification failure | Attempt bounded automatic repair before escalation | None fixed | In-place task repair, verification retry |

## Navigation, Orchestration, And Reporting Workflows

| Workflow | Triggered by | Main purpose | Typical agents | Main outputs / side effects |
|---------|--------------|--------------|----------------|-----------------------------|
| `next` | `/gsdt:next` | Detect current state and route to the next logical command | None | Inline next-step routing |
| `progress` | `/gsdt:progress` | Summarize current state and recommend next action | None | Inline progress view |
| `resume-project` | `/gsdt:resume-work` | Restore working context after reset or pause | None | Inline restoration summary |
| `pause-work` | `/gsdt:pause-work` | Save machine-readable and human-readable handoff state | None | `HANDOFF.json`, `.continue-here.md` |
| `manager` | `/gsdt:manager` | Interactive multi-phase dashboard and dispatch center | None | Inline dashboard, command routing |
| `autonomous` | `/gsdt:autonomous` | Run phases end-to-end automatically | Downstream command agents | Chained phase artifacts and automated routing |
| `auto` | `/gsdt:auto` | One-click autopilot from natural language input | Downstream command agents | Capture/intake-driven downstream artifacts |
| `do` | `/gsdt:do` | Route freeform text to the best GSDT command | None | Inline routing result |
| `help` | `/gsdt:help` | Render the canonical command reference | None | Inline help output |
| `stats` | `/gsdt:stats` | Show project statistics | None | Inline metrics output |
| `session-report` | `/gsdt:session-report` | Write a post-session summary | None | `reports/SESSION_REPORT.md` |
| `health` | `/gsdt:health` | Validate planning-directory integrity | None | Inline diagnostics, optional repairs |
| `update` | `/gsdt:update` | Update GSDT and show changelog | None | Runtime update, optional patch backup |
| `forensics` | `/gsdt:forensics` | Investigate failed or stalled workflows | None | `forensics/report-{timestamp}.md` |
| `pr-branch` | `/gsdt:pr-branch` | Create a clean code-review branch without planning commits | None | New filtered git branch |
| `review` | `/gsdt:review` | Run cross-AI peer review of plans | External AI CLIs | `{phase}-REVIEWS.md`, `{phase}-REVIEWS.json` |
| `ship` | `/gsdt:ship` | Create PR and prepare reviewed work for merge | None fixed | GitHub PR, updated state |
| `audit-uat` | `/gsdt:audit-uat` | Find unresolved UAT and verification items across phases | None | Inline prioritized UAT audit |

## Quick, Intake, Capture, And Context Workflows

| Workflow | Triggered by | Main purpose | Typical agents | Main outputs / side effects |
|---------|--------------|--------------|----------------|-----------------------------|
| `quick` | `/gsdt:quick` | Run an ad-hoc task with GSDT guarantees | `gsdt-phase-researcher`, `gsdt-planner`, `gsdt-plan-checker`, `gsdt-executor`, `gsdt-verifier` | `.gsdt-planning/quick/*`, quick `RESEARCH.md`, `PLAN.md`, `SUMMARY.md`, state updates |
| `fast` | `/gsdt:fast` | Execute trivial tasks inline without agent overhead | None | Direct code/doc changes, optional commit |
| `intake` | `/gsdt:intake` | Semantic-first intake from freeform text | No GSDT agents; uses intake subskills + CLI | `.gsdt-intake/ledger.json`, `cards.md`, `brief.md`, `readiness.json`, phase intake briefs |
| `intake-normalize` | `/gsdt:intake-normalize` | Convert raw text into conservative planning units | None | `<intake_units_json>` machine-readable block |
| `intake-resolve-units` | `/gsdt:intake-resolve-units` | Resolve duplicates/conflicts between intake units | None | `<intake_resolution_json>` machine-readable block |
| `intake-assess-readiness` | `/gsdt:intake-assess-readiness` | Recommend the next intake action conservatively | None | `<intake_assessment_json>` machine-readable block |
| `intake-write-brief` | `/gsdt:intake-write-brief` | Draft cards and brief content from intake state | None | `<intake_artifacts_json>` machine-readable block |
| `capture` | `/gsdt:capture` | Save freeform idea fragments into a graph model | No GSDT agents; uses capture CLI | `captures/graph.md`, `captures/state.json`, `captures/fragments/*`, optional `captures/idea.md` |
| `find` | `/gsdt:find` | Quick lookup for existing solution docs | None | Inline solution-doc match |
| `add-todo` | `/gsdt:add-todo` | Capture a structured todo for later work | None | `.gsdt-planning/todos/pending/*.md`, optional state update |
| `check-todos` | `/gsdt:check-todos` | List todos and route one into action | None | Todo state updates, optional state/git updates |
| `note` | `/gsdt:note` | Zero-friction note capture, listing, and promotion | None | `.gsdt-planning/notes/*.md` or `~/.claude/notes/*.md` |
| `plant-seed` | `/gsdt:plant-seed` | Save a future-facing idea with trigger conditions | None | `.gsdt-planning/seeds/SEED-NNN-slug.md` |
| `compound-learning` | Internal sidecar workflow | Process bug/fix learnings into reusable compound memory | Compound pipeline, no standard agent | Compound event store, solution-doc memory, anti-pattern updates |

## Inline And Command-Local Flows

Not every command delegates to a dedicated `gsdt/workflows/*.md` file. Some commands are still implemented inline in `commands/gsdt/*.md` or via direct `gsdt-tools.cjs` calls:

| Command | Implementation style | Main reason |
|---------|----------------------|-------------|
| `/gsdt:set-profile` | Inline shell call to `config-set-model-profile` | Single-purpose config mutation |
| `/gsdt:debug` | Inline orchestrator prompt | Tight checkpoint loop around `gsdt-debugger` |
| `/gsdt:research-phase` | Inline orchestrator prompt | Lightweight wrapper around `gsdt-phase-researcher` |
| `/gsdt:workstreams` | Inline command prompt + `gsdt-tools workstream *` | Thin UI over deterministic CLI |
| `/gsdt:add-backlog` | Inline command prompt | Simple roadmap + directory mutation |
| `/gsdt:review-backlog` | Inline command prompt | Interactive backlog promotion flow |
| `/gsdt:thread` | Inline command prompt | Simple file-backed context threads |
| `/gsdt:reapply-patches` | Inline command prompt | Merge local custom patches after update |
| `/gsdt:join-discord` | Inline static output | No orchestration needed |

## Related References

- `COMMANDS.md` — all user-facing slash commands
- `AGENTS.md` — specialized agents and reviewer families
- `CLI-TOOLS.md` — deterministic `gsdt-tools.cjs` command surface
- `REFERENCE-MAP.md` — command -> workflow -> agent -> artifact mapping plus reverse lookup tables
