# GSDT Reference Map

> Complete `command -> workflow -> agent -> artifact` reference, followed by practical reverse-lookup tables.

## Reading This Map

| Term | Meaning |
|------|---------|
| `inline` | The command is implemented directly in `commands/gsdt/*.md` instead of delegating to a dedicated workflow file |
| `same-name` | The command delegates to `gsdt/workflows/<command-name>.md` |
| `none` | No dedicated GSDT agent is spawned; the flow is inline or CLI-driven |
| `external AI CLI` | The workflow shells out to Gemini / Claude / Codex CLI instead of a GSDT agent |

## Core Lifecycle Commands

| Command | Workflow | Agent(s) | Main artifact(s) |
|---------|----------|----------|------------------|
| `/gsdt:new-project` | `new-project` | `gsdt-project-researcher` x4, `gsdt-research-synthesizer`, `gsdt-roadmapper` | `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`, `research/*` |
| `/gsdt:discuss-phase` | `discuss-phase` or `discuss-phase-assumptions` | optional `gsdt-assumptions-analyzer`; optional advisor research path | `{phase}-CONTEXT.md`, `{phase}-DISCUSSION-LOG.md` |
| `/gsdt:ui-phase` | `ui-phase` | `gsdt-ui-researcher`, `gsdt-ui-checker` | `{phase}-UI-SPEC.md` |
| `/gsdt:plan-phase` | `plan-phase` | `gsdt-phase-researcher`, `gsdt-planner`, `gsdt-plan-checker` | `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`, `{phase}-VALIDATION.md` |
| `/gsdt:execute-phase` | `execute-phase` | `gsdt-executor`, `gsdt-verifier`, assess reviewer family, `gsdt-review-fixer` | `{phase}-{N}-SUMMARY.md`, `{phase}-VERIFICATION.md`, `{phase}-ASSESS.md`, `{phase}-ASSESS.json`, git commits |
| `/gsdt:verify-work` | `verify-work` | `gsdt-debugger`, `gsdt-planner`, `gsdt-plan-checker` | `{phase}-UAT.md`, debug session files, verified gap-fix plans |
| `/gsdt:ui-review` | `ui-review` | `gsdt-ui-auditor` | `{phase}-UI-REVIEW.md`, UI review screenshots |
| `/gsdt:ship` | `ship` | none | GitHub PR, updated `STATE.md` |
| `/gsdt:audit-uat` | `audit-uat` | none | Cross-phase UAT audit output |
| `/gsdt:audit-milestone` | `audit-milestone` | `gsdt-integration-checker` | `v{version}-MILESTONE-AUDIT.md` |
| `/gsdt:complete-milestone` | `complete-milestone` | none | `MILESTONES.md`, milestone archives, git tag |
| `/gsdt:milestone-summary` | `milestone-summary` | none | `reports/MILESTONE_SUMMARY-v{version}.md` |
| `/gsdt:new-milestone` | `new-milestone` | `gsdt-project-researcher`, `gsdt-research-synthesizer`, `gsdt-roadmapper` | refreshed `PROJECT.md`, new `REQUIREMENTS.md`, new `ROADMAP.md`, reset `STATE.md` |
| `/gsdt:next` | `next` | none | Inline routing to the next command |
| `/gsdt:session-report` | `session-report` | none | `reports/SESSION_REPORT.md` |

## Phase Management And Brownfield Commands

| Command | Workflow | Agent(s) | Main artifact(s) |
|---------|----------|----------|------------------|
| `/gsdt:add-phase` | `add-phase` | none | updated `ROADMAP.md`, new phase directory |
| `/gsdt:insert-phase` | `insert-phase` | none | updated `ROADMAP.md`, new decimal phase directory |
| `/gsdt:remove-phase` | `remove-phase` | none | updated `ROADMAP.md`, deleted or renumbered phase directories |
| `/gsdt:list-phase-assumptions` | `list-phase-assumptions` | none | Inline assumptions preview |
| `/gsdt:plan-milestone-gaps` | `plan-milestone-gaps` | none | updated `ROADMAP.md`, new gap phases |
| `/gsdt:research-phase` | `inline` (mirrors `research-phase`) | `gsdt-phase-researcher` | `{phase}-RESEARCH.md` |
| `/gsdt:validate-phase` | `validate-phase` | `gsdt-nyquist-auditor` | test files, `{phase}-VALIDATION.md` |
| `/gsdt:map-codebase` | `map-codebase` | `gsdt-codebase-mapper` x4 | `.gsdt-planning/codebase/*.md` |

## Navigation, Execution Aids, And Diagnostics

| Command | Workflow | Agent(s) | Main artifact(s) |
|---------|----------|----------|------------------|
| `/gsdt:progress` | `progress` | none | Inline progress summary |
| `/gsdt:resume-work` | `resume-project` | none | Inline restore summary |
| `/gsdt:pause-work` | `pause-work` | none | `HANDOFF.json`, `.continue-here.md` |
| `/gsdt:manager` | `manager` | none | Inline dashboard and routing |
| `/gsdt:help` | `help` | none | Inline command reference |
| `/gsdt:quick` | `quick` | `gsdt-phase-researcher`, `gsdt-planner`, `gsdt-plan-checker`, `gsdt-executor`, `gsdt-verifier` | `.gsdt-planning/quick/*`, quick `RESEARCH.md`, `PLAN.md`, `SUMMARY.md` |
| `/gsdt:fast` | `fast` | none | direct code/doc changes, optional commit |
| `/gsdt:autonomous` | `autonomous` | downstream phase agents | chained phase artifacts across roadmap |
| `/gsdt:do` | `do` | none | Inline command routing |
| `/gsdt:debug` | `inline` | `gsdt-debugger` | `.gsdt-planning/debug/*.md` |
| `/gsdt:add-tests` | `add-tests` | none fixed | test files |
| `/gsdt:stats` | `stats` | none | Inline metrics output |
| `/gsdt:profile-user` | `profile-user` | `gsdt-user-profiler` | `USER-PROFILE.md`, dev-preferences output, `CLAUDE.md` profile section |
| `/gsdt:health` | `health` | none | Inline diagnostics, optional repair |
| `/gsdt:cleanup` | `cleanup` | none | archived phase directories |
| `/gsdt:forensics` | `forensics` | none | `forensics/report-{timestamp}.md` |
| `/gsdt:review` | `review` | external AI CLI | `{phase}-REVIEWS.md`, `{phase}-REVIEWS.json` |
| `/gsdt:pr-branch` | `pr-branch` | none | clean PR branch |

## Intake, Capture, Notes, Todos, Backlog, Threads

| Command | Workflow | Agent(s) | Main artifact(s) |
|---------|----------|----------|------------------|
| `/gsdt:auto` | `auto` | downstream command agents | capture/intake-driven downstream artifacts |
| `/gsdt:capture` | `capture` | none fixed; uses capture CLI | `.gsdt-planning/captures/graph.md`, `state.json`, `fragments/*`, optional `idea.md` |
| `/gsdt:intake` | `intake` | none fixed; uses intake subskills + CLI | `.gsdt-intake/ledger.json`, `readiness.json`, `cards.md`, `brief.md`, phase `*-INTAKE.md` |
| `/gsdt:intake-normalize` | `intake-normalize` | none | `<intake_units_json>` |
| `/gsdt:intake-resolve-units` | `intake-resolve-units` | none | `<intake_resolution_json>` |
| `/gsdt:intake-assess-readiness` | `intake-assess-readiness` | none | `<intake_assessment_json>` |
| `/gsdt:intake-write-brief` | `intake-write-brief` | none | `<intake_artifacts_json>` and downstream `.gsdt-intake/*` materialization |
| `/gsdt:note` | `note` | none | `.gsdt-planning/notes/*.md` or `~/.claude/notes/*.md` |
| `/gsdt:add-todo` | `add-todo` | none | `.gsdt-planning/todos/pending/*.md`, optional `STATE.md` update |
| `/gsdt:check-todos` | `check-todos` | none | todo updates, possible `STATE.md` update and commit |
| `/gsdt:add-backlog` | `inline` | none | updated `ROADMAP.md`, `.gsdt-planning/phases/999.x-*` |
| `/gsdt:review-backlog` | `inline` | none | updated `ROADMAP.md`, promoted/removed backlog phase directories |
| `/gsdt:plant-seed` | `plant-seed` | none | `.gsdt-planning/seeds/SEED-NNN-slug.md` |
| `/gsdt:thread` | `inline` | none | `.gsdt-planning/threads/*.md` |
| `/gsdt:find` | `find` | none | Inline solution-doc match from compound memory |

## Workspaces, Configuration, And Maintenance

| Command | Workflow | Agent(s) | Main artifact(s) |
|---------|----------|----------|------------------|
| `/gsdt:new-workspace` | `new-workspace` | none | `WORKSPACE.md`, isolated workspace `.gsdt-planning/`, worktree/clone setup |
| `/gsdt:list-workspaces` | `list-workspaces` | none | Inline workspace table |
| `/gsdt:remove-workspace` | `remove-workspace` | none | workspace deletion and cleanup |
| `/gsdt:workstreams` | `inline` via `gsdt-tools workstream *` | none | `.gsdt-planning/workstreams/{name}/*` |
| `/gsdt:settings` | `settings` | none | `.gsdt-planning/config.json`, optional `~/.gsdt/defaults.json` |
| `/gsdt:set-profile` | `inline` | none | updated model profile in config |
| `/gsdt:update` | `update` | none | runtime update, optional backup state |
| `/gsdt:reapply-patches` | `inline` | none | merged local patch files after update |
| `/gsdt:join-discord` | `inline` | none | no file output; invite link only |

## Internal-Only Workflow Map

These workflows are important, but they are usually reached from other commands instead of being invoked directly by end users.

| Workflow | Usually called from | Agent(s) | Main artifact(s) |
|---------|---------------------|----------|------------------|
| `execute-plan` | `execute-phase`, `quick` | `gsdt-executor` | plan `SUMMARY.md`, commits |
| `verify-phase` | `execute-phase` | `gsdt-verifier` | `VERIFICATION.md` |
| `assess` | `execute-phase` | assess reviewer family, `gsdt-review-fixer` | `ASSESS.md`, `ASSESS.json` |
| `diagnose-issues` | `verify-work` | `gsdt-debugger` | updated UAT gaps, debug sessions |
| `transition` | `execute-phase` auto-advance | none | internal next-step routing |
| `node-repair` | `execute-plan` | none fixed | bounded auto-fix before escalation |
| `discovery-phase` | internal automation | none | discovery routing / prep |
| `compound-learning` | debug, execute, verify failure paths | compound pipeline | solution memory, anti-pattern updates |

## Most Practical Reverse Lookup

### If You See A File, Start Here

| File or directory | Most likely source |
|-------------------|--------------------|
| `PROJECT.md` | `/gsdt:new-project` or `/gsdt:new-milestone` |
| `ROADMAP.md` | `/gsdt:new-project`, `/gsdt:new-milestone`, or roadmap-management commands |
| `STATE.md` | initialized by `/gsdt:new-project`, updated by most execution/status commands |
| `{phase}-CONTEXT.md` | `/gsdt:discuss-phase` |
| `{phase}-UI-SPEC.md` | `/gsdt:ui-phase` |
| `{phase}-RESEARCH.md` | `/gsdt:plan-phase` or `/gsdt:research-phase` |
| `{phase}-{N}-PLAN.md` | `/gsdt:plan-phase` |
| `{phase}-{N}-SUMMARY.md` | `/gsdt:execute-phase` |
| `{phase}-VERIFICATION.md` | `/gsdt:execute-phase` |
| `{phase}-HUMAN-UAT.md` | `/gsdt:execute-phase` when verifier returns `human_needed` |
| `{phase}-UAT.md` | `/gsdt:verify-work` |
| `{phase}-ASSESS.md` / `{phase}-ASSESS.json` | `/gsdt:execute-phase` internal assess step |
| `{phase}-REVIEWS.md` / `{phase}-REVIEWS.json` | `/gsdt:review` |
| `{phase}-UI-REVIEW.md` | `/gsdt:ui-review` |
| `{phase}-VALIDATION.md` | `/gsdt:plan-phase` or `/gsdt:validate-phase` |
| `v{version}-MILESTONE-AUDIT.md` | `/gsdt:audit-milestone` |
| `reports/SESSION_REPORT.md` | `/gsdt:session-report` |
| `reports/MILESTONE_SUMMARY-v{version}.md` | `/gsdt:milestone-summary` |
| `codebase/*.md` | `/gsdt:map-codebase` |
| `debug/*.md` | `/gsdt:debug` or `/gsdt:verify-work` failure diagnosis |
| `quick/{id}-{slug}/` | `/gsdt:quick` |
| `.gsdt-intake/*` | `/gsdt:intake` |
| `captures/*` | `/gsdt:capture` |
| `notes/*.md` | `/gsdt:note` |
| `todos/pending/*.md` | `/gsdt:add-todo` or `/gsdt:note promote` |
| `seeds/SEED-*.md` | `/gsdt:plant-seed` |
| `threads/*.md` | `/gsdt:thread` |
| `WORKSPACE.md` | `/gsdt:new-workspace` |
| `USER-PROFILE.md` | `/gsdt:profile-user` |

### If You Need To Do X, Start Here

| Goal | Start with |
|------|------------|
| Turn an idea into a roadmap | `/gsdt:new-project` |
| Capture requirements without formalizing them yet | `/gsdt:intake` |
| Build an idea graph from fragments | `/gsdt:capture` |
| Lock implementation decisions before planning | `/gsdt:discuss-phase N` |
| Create implementation plans | `/gsdt:plan-phase N` |
| Execute planned work | `/gsdt:execute-phase N` |
| Do human acceptance testing | `/gsdt:verify-work N` |
| Audit frontend quality | `/gsdt:ui-review N` |
| Generate or fill test gaps | `/gsdt:add-tests` or `/gsdt:validate-phase N` |
| Debug a persistent issue | `/gsdt:debug "problem"` |
| Review plans with multiple AI systems | `/gsdt:review --phase N --all` |
| Create a clean PR branch | `/gsdt:pr-branch` |
| Ship verified work | `/gsdt:ship N` |
| Restore context after reset | `/gsdt:resume-work` |
| Pause safely mid-stream | `/gsdt:pause-work` |
| Inspect project state and next action | `/gsdt:progress` or `/gsdt:next` |
| Archive a shipped milestone | `/gsdt:complete-milestone` |
| Create isolated repo workspaces | `/gsdt:new-workspace` |

## Related References

- `COMMANDS.md` — full command syntax and flags
- `WORKFLOWS.md` — workflow inventory and grouping
- `AGENTS.md` — agent roles and tools
- `CLI-TOOLS.md` — deterministic internal CLI command surface
