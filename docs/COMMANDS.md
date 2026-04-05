# GSDT Command Reference

> Complete command syntax, flags, options, and examples. For feature details, see [Feature Reference](FEATURES.md). For workflow walkthroughs, see [User Guide](USER-GUIDE.md).

---

## Command Syntax

- **Claude Code / Gemini / Copilot:** `/gsdt:command-name [args]`
- **OpenCode:** `/gsd-command-name [args]`
- **Codex:** `$gsd-command-name [args]`

---

## Core Workflow Commands

### `/gsdt:new-project`

Initialize a new project with deep context gathering.

| Flag | Description |
|------|-------------|
| `--auto @file.md` | Auto-extract from document, skip interactive questions |

**Prerequisites:** No existing `.claude/.gsdt-planning/PROJECT.md`
**Produces:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json`, `research/`, `CLAUDE.md`

```bash
/gsdt:new-project                    # Interactive mode
/gsdt:new-project --auto @prd.md     # Auto-extract from PRD
```

---

### `/gsdt:new-workspace`

Create an isolated workspace with repo copies and independent `.claude/.gsdt-planning/` directory.

| Flag | Description |
|------|-------------|
| `--name <name>` | Workspace name (required) |
| `--repos repo1,repo2` | Comma-separated repo paths or names |
| `--path /target` | Target directory (default: `~/gsdt-workspaces/<name>`) |
| `--strategy worktree\|clone` | Copy strategy (default: `worktree`) |
| `--branch <name>` | Branch to checkout (default: `workspace/<name>`) |
| `--auto` | Skip interactive questions |

**Use cases:**
- Multi-repo: work on a subset of repos with isolated GSDT state
- Feature isolation: `--repos .` creates a worktree of the current repo

**Produces:** `WORKSPACE.md`, `.claude/.gsdt-planning/`, repo copies (worktrees or clones)

```bash
/gsdt:new-workspace --name feature-b --repos hr-ui,ZeymoAPI
/gsdt:new-workspace --name feature-b --repos . --strategy worktree  # Same-repo isolation
/gsdt:new-workspace --name spike --repos api,web --strategy clone   # Full clones
```

---

### `/gsdt:list-workspaces`

List active GSDT workspaces and their status.

**Scans:** `~/gsdt-workspaces/` for `WORKSPACE.md` manifests
**Shows:** Name, repo count, strategy, GSDT project status

```bash
/gsdt:list-workspaces
```

---

### `/gsdt:remove-workspace`

Remove a workspace and clean up git worktrees.

| Argument | Required | Description |
|----------|----------|-------------|
| `<name>` | Yes | Workspace name to remove |

**Safety:** Refuses removal if any repo has uncommitted changes. Requires name confirmation.

```bash
/gsdt:remove-workspace feature-b
```

---

### `/gsdt:discuss-phase`

Capture implementation decisions before planning.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to current phase) |

| Flag | Description |
|------|-------------|
| `--auto` | Auto-select recommended defaults for all questions |
| `--batch` | Group questions for batch intake instead of one-by-one |
| `--analyze` | Add trade-off analysis during discussion |

**Prerequisites:** `.claude/.gsdt-planning/ROADMAP.md` exists
**Produces:** `{phase}-CONTEXT.md`, `{phase}-DISCUSSION-LOG.md` (audit trail)

```bash
/gsdt:discuss-phase 1                # Interactive discussion for phase 1
/gsdt:discuss-phase 3 --auto         # Auto-select defaults for phase 3
/gsdt:discuss-phase --batch          # Batch mode for current phase
/gsdt:discuss-phase 2 --analyze      # Discussion with trade-off analysis
```

---

### `/gsdt:ui-phase`

Generate UI design contract for frontend phases.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to current phase) |

**Prerequisites:** `.claude/.gsdt-planning/ROADMAP.md` exists, phase has frontend/UI work
**Produces:** `{phase}-UI-SPEC.md`

```bash
/gsdt:ui-phase 2                     # Design contract for phase 2
```

---

### `/gsdt:plan-phase`

Research, plan, and verify a phase.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to next unplanned phase) |

| Flag | Description |
|------|-------------|
| `--auto` | Skip interactive confirmations |
| `--research` | Force re-research even if RESEARCH.md exists |
| `--skip-research` | Skip domain research step |
| `--gaps` | Gap closure mode (reads VERIFICATION.md, skips research) |
| `--skip-verify` | Skip plan checker verification loop |
| `--prd <file>` | Use a PRD file instead of discuss-phase for context |
| `--reviews` | Replan with cross-AI review feedback from REVIEWS.md |

**Prerequisites:** `.claude/.gsdt-planning/ROADMAP.md` exists
**Produces:** `{phase}-RESEARCH.md`, `{phase}-{N}-PLAN.md`, `{phase}-VALIDATION.md`

```bash
/gsdt:plan-phase 1                   # Research + plan + verify phase 1
/gsdt:plan-phase 3 --skip-research   # Plan without research (familiar domain)
/gsdt:plan-phase --auto              # Non-interactive planning
```

---

### `/gsdt:execute-phase`

Execute all plans in a phase with wave-based parallelization, or run a specific wave.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | **Yes** | Phase number to execute |
| `--wave N` | No | Execute only Wave `N` in the phase |

**Prerequisites:** Phase has PLAN.md files
**Produces:** per-plan `{phase}-{N}-SUMMARY.md`, git commits, and `{phase}-VERIFICATION.md` when the phase is fully complete

```bash
/gsdt:execute-phase 1                # Execute phase 1
/gsdt:execute-phase 1 --wave 2       # Execute only Wave 2
```

---

### `/gsdt:verify-work`

User acceptance testing with auto-diagnosis.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to last executed phase) |

**Prerequisites:** Phase has been executed
**Produces:** `{phase}-UAT.md`, fix plans if issues found

```bash
/gsdt:verify-work 1                  # UAT for phase 1
```

---

### `/gsdt:next`

Automatically advance to the next logical workflow step. Reads project state and runs the appropriate command.

**Prerequisites:** `.claude/.gsdt-planning/` directory exists
**Behavior:**
- No project → suggests `/gsdt:new-project`
- Phase needs discussion → runs `/gsdt:discuss-phase`
- Phase needs planning → runs `/gsdt:plan-phase`
- Phase needs execution → runs `/gsdt:execute-phase`
- Phase needs verification → runs `/gsdt:verify-work`
- All phases complete → suggests `/gsdt:complete-milestone`

```bash
/gsdt:next                           # Auto-detect and run next step
```

---

### `/gsdt:session-report`

Generate a session report with work summary, outcomes, and estimated resource usage.

**Prerequisites:** Active project with recent work
**Produces:** `.claude/.gsdt-planning/reports/SESSION_REPORT.md`

```bash
/gsdt:session-report                 # Generate post-session summary
```

**Report includes:**
- Work performed (commits, plans executed, phases progressed)
- Outcomes and deliverables
- Blockers and decisions made
- Estimated token/cost usage
- Next steps recommendation

---

### `/gsdt:ship`

Create PR from completed phase work with auto-generated body.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number or milestone version (e.g., `4` or `v1.0`) |
| `--draft` | No | Create as draft PR |

**Prerequisites:** Phase verified (`/gsdt:verify-work` passed), `gh` CLI installed and authenticated
**Produces:** GitHub PR with rich body from planning artifacts, STATE.md updated

```bash
/gsdt:ship 4                         # Ship phase 4
/gsdt:ship 4 --draft                 # Ship as draft PR
```

**PR body includes:**
- Phase goal from ROADMAP.md
- Changes summary from SUMMARY.md files
- Requirements addressed (REQ-IDs)
- Verification status
- Key decisions

---

### `/gsdt:ui-review`

Retroactive 6-pillar visual audit of implemented frontend.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number (defaults to last executed phase) |

**Prerequisites:** Project has frontend code (works standalone, no GSDT project needed)
**Produces:** `{phase}-UI-REVIEW.md`, screenshots in `.claude/.gsdt-planning/ui-reviews/`

```bash
/gsdt:ui-review                      # Audit current phase
/gsdt:ui-review 3                    # Audit phase 3
```

---

### `/gsdt:audit-uat`

Cross-phase audit of all outstanding UAT and verification items.

**Prerequisites:** At least one phase has been executed with UAT or verification
**Produces:** Categorized audit report with human test plan

```bash
/gsdt:audit-uat
```

---

### `/gsdt:audit-milestone`

Verify milestone met its definition of done.

**Prerequisites:** All phases executed
**Produces:** Audit report with gap analysis

```bash
/gsdt:audit-milestone
```

---

### `/gsdt:complete-milestone`

Archive milestone, tag release.

**Prerequisites:** Milestone audit complete (recommended)
**Produces:** `MILESTONES.md` entry, git tag

```bash
/gsdt:complete-milestone
```

---

### `/gsdt:milestone-summary`

Generate comprehensive project summary from milestone artifacts for team onboarding and review.

| Argument | Required | Description |
|----------|----------|-------------|
| `version` | No | Milestone version (defaults to current/latest milestone) |

**Prerequisites:** At least one completed or in-progress milestone
**Produces:** `.claude/.gsdt-planning/reports/MILESTONE_SUMMARY-v{version}.md`

**Summary includes:**
- Overview, architecture decisions, phase-by-phase breakdown
- Key decisions and trade-offs
- Requirements coverage
- Tech debt and deferred items
- Getting started guide for new team members
- Interactive Q&A offered after generation

```bash
/gsdt:milestone-summary                # Summarize current milestone
/gsdt:milestone-summary v1.0           # Summarize specific milestone
```

---

### `/gsdt:new-milestone`

Start next version cycle.

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | No | Milestone name |
| `--reset-phase-numbers` | No | Restart the new milestone at Phase 1 and archive old phase dirs before roadmapping |

**Prerequisites:** Previous milestone completed
**Produces:** Updated `PROJECT.md`, new `REQUIREMENTS.md`, new `ROADMAP.md`

```bash
/gsdt:new-milestone                  # Interactive
/gsdt:new-milestone "v2.0 Mobile"    # Named milestone
/gsdt:new-milestone --reset-phase-numbers "v2.0 Mobile"  # Restart milestone numbering at 1
```

---

## Phase Management Commands

### `/gsdt:add-phase`

Append new phase to roadmap.

```bash
/gsdt:add-phase                      # Interactive — describe the phase
```

### `/gsdt:insert-phase`

Insert urgent work between phases using decimal numbering.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Insert after this phase number |

```bash
/gsdt:insert-phase 3                 # Insert between phase 3 and 4 → creates 3.1
```

### `/gsdt:remove-phase`

Remove future phase and renumber subsequent phases.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number to remove |

```bash
/gsdt:remove-phase 7                 # Remove phase 7, renumber 8→7, 9→8, etc.
```

### `/gsdt:list-phase-assumptions`

Preview Claude's intended approach before planning.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number |

```bash
/gsdt:list-phase-assumptions 2       # See assumptions for phase 2
```

### `/gsdt:plan-milestone-gaps`

Create phases to close gaps from milestone audit.

```bash
/gsdt:plan-milestone-gaps             # Creates phases for each audit gap
```

### `/gsdt:research-phase`

Deep ecosystem research only (standalone — usually use `/gsdt:plan-phase` instead).

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number |

```bash
/gsdt:research-phase 4               # Research phase 4 domain
```

### `/gsdt:validate-phase`

Retroactively audit and fill Nyquist validation gaps.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number |

```bash
/gsdt:validate-phase 2               # Audit test coverage for phase 2
```

---

## Navigation Commands

### `/gsdt:progress`

Show status and next steps.

```bash
/gsdt:progress                       # "Where am I? What's next?"
```

### `/gsdt:resume-work`

Restore full context from last session.

```bash
/gsdt:resume-work                    # After context reset or new session
```

### `/gsdt:pause-work`

Save context handoff when stopping mid-phase.

```bash
/gsdt:pause-work                     # Creates continue-here.md
```

### `/gsdt:manager`

Interactive command center for managing multiple phases from one terminal.

**Prerequisites:** `.claude/.gsdt-planning/ROADMAP.md` exists
**Behavior:**
- Dashboard of all phases with visual status indicators
- Recommends optimal next actions based on dependencies and progress
- Dispatches work: discuss runs inline, plan/execute run as background agents
- Designed for power users parallelizing work across phases from one terminal

```bash
/gsdt:manager                        # Open command center dashboard
```

---

### `/gsdt:help`

Show all commands and usage guide.

```bash
/gsdt:help                           # Quick reference
```

---

## Utility Commands

### `/gsdt:quick`

Execute ad-hoc task with GSDT guarantees.

| Flag | Description |
|------|-------------|
| `--full` | Enable plan checking (2 iterations) + post-execution verification |
| `--discuss` | Lightweight pre-planning discussion |
| `--research` | Spawn focused researcher before planning |

Flags are composable.

```bash
/gsdt:quick                          # Basic quick task
/gsdt:quick --discuss --research     # Discussion + research + planning
/gsdt:quick --full                   # With plan checking and verification
/gsdt:quick --discuss --research --full  # All optional stages
```

### `/gsdt:autonomous`

Run all remaining phases autonomously.

| Flag | Description |
|------|-------------|
| `--from N` | Start from a specific phase number |

```bash
/gsdt:autonomous                     # Run all remaining phases
/gsdt:autonomous --from 3            # Start from phase 3
```

### `/gsdt:do`

Route freeform text to the right GSDT command.

```bash
/gsdt:do                             # Then describe what you want
```

### `/gsdt:intake`

Quiet semantic intake for freeform ideas, constraints, and phase refinements.

| Argument | Required | Description |
|----------|----------|-------------|
| `text` | Yes | Raw input to normalize into semantic planning units |

**Behavior:**
- Persists raw input under `.claude/.gsdt-intake/raw/`
- Normalizes freeform input into `user_story`, `constraint`, `preference`, `technical_enabler`, and `open_question`
- Uses dedicated `gsdt:intake-*` subskills for semantic normalization, resolution, readiness, and brief drafting, while the CLI enforces deterministic guards and materialization
- Auto-triggers `/gsdt:new-project --auto` only when cold-start semantic readiness is high
- Auto-triggers `/gsdt:plan-phase N --prd ...` only when a target phase is confident and no existing plans are present
- Falls back to one-line `collect_more`, `idle`, or `backlog_candidate` status when confidence is not high enough

```bash
/gsdt:intake "I want a low-friction way to turn rough ideas into a project brief"
/gsdt:intake "Phase 2 should only cover email/password login, not social auth yet"
```

### `/gsdt:note`

Zero-friction idea capture — append, list, or promote notes to todos.

| Argument | Required | Description |
|----------|----------|-------------|
| `text` | No | Note text to capture (default: append mode) |
| `list` | No | List all notes from project and global scopes |
| `promote N` | No | Convert note N into a structured todo |

| Flag | Description |
|------|-------------|
| `--global` | Use global scope for note operations |

```bash
/gsdt:note "Consider caching strategy for API responses"
/gsdt:note list
/gsdt:note promote 3
```

### `/gsdt:debug`

Systematic debugging with persistent state.

| Argument | Required | Description |
|----------|----------|-------------|
| `description` | No | Description of the bug |

```bash
/gsdt:debug "Login button not responding on mobile Safari"
```

### `/gsdt:add-todo`

Capture idea or task for later.

| Argument | Required | Description |
|----------|----------|-------------|
| `description` | No | Todo description |

```bash
/gsdt:add-todo "Consider adding dark mode support"
```

### `/gsdt:check-todos`

List pending todos and select one to work on.

```bash
/gsdt:check-todos
```

### `/gsdt:add-tests`

Generate tests for a completed phase.

| Argument | Required | Description |
|----------|----------|-------------|
| `N` | No | Phase number |

```bash
/gsdt:add-tests 2                    # Generate tests for phase 2
```

### `/gsdt:stats`

Display project statistics.

```bash
/gsdt:stats                          # Project metrics dashboard
```

### `/gsdt:profile-user`

Generate a developer behavioral profile from Claude Code session analysis across 8 dimensions (communication style, decision patterns, debugging approach, UX preferences, vendor choices, frustration triggers, learning style, explanation depth). Produces artifacts that personalize Claude's responses.

| Flag | Description |
|------|-------------|
| `--questionnaire` | Use interactive questionnaire instead of session analysis |
| `--refresh` | Re-analyze sessions and regenerate profile |

**Generated artifacts:**
- `USER-PROFILE.md` — Full behavioral profile
- `/gsdt:dev-preferences` command — Load preferences in any session
- `CLAUDE.md` profile section — Auto-discovered by Claude Code

```bash
/gsdt:profile-user                   # Analyze sessions and build profile
/gsdt:profile-user --questionnaire   # Interactive questionnaire fallback
/gsdt:profile-user --refresh         # Re-generate from fresh analysis
```

### `/gsdt:health`

Validate `.claude/.gsdt-planning/` directory integrity.

| Flag | Description |
|------|-------------|
| `--repair` | Auto-fix recoverable issues |

```bash
/gsdt:health                         # Check integrity
/gsdt:health --repair                # Check and fix
```

### `/gsdt:cleanup`

Archive accumulated phase directories from completed milestones.

```bash
/gsdt:cleanup
```

---

## Diagnostics Commands

### `/gsdt:forensics`

Post-mortem investigation of failed or stuck GSDT workflows.

| Argument | Required | Description |
|----------|----------|-------------|
| `description` | No | Problem description (prompted if omitted) |

**Prerequisites:** `.claude/.gsdt-planning/` directory exists
**Produces:** `.claude/.gsdt-planning/forensics/report-{timestamp}.md`

**Investigation covers:**
- Git history analysis (recent commits, stuck patterns, time gaps)
- Artifact integrity (expected files for completed phases)
- STATE.md anomalies and session history
- Uncommitted work, conflicts, abandoned changes
- At least 4 anomaly types checked (stuck loop, missing artifacts, abandoned work, crash/interruption)
- GitHub issue creation offered if actionable findings exist

```bash
/gsdt:forensics                              # Interactive — prompted for problem
/gsdt:forensics "Phase 3 execution stalled"  # With problem description
```

---

## Workstream Management

### `/gsdt:workstreams`

Manage parallel workstreams for concurrent work on different milestone areas.

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `list` | List all workstreams with status (default if no subcommand) |
| `create <name>` | Create a new workstream |
| `status <name>` | Detailed status for one workstream |
| `switch <name>` | Set active workstream |
| `progress` | Progress summary across all workstreams |
| `complete <name>` | Archive a completed workstream |
| `resume <name>` | Resume work in a workstream |

**Prerequisites:** Active GSDT project
**Produces:** Workstream directories under `.claude/.gsdt-planning/`, state tracking per workstream

```bash
/gsdt:workstreams                    # List all workstreams
/gsdt:workstreams create backend-api # Create new workstream
/gsdt:workstreams switch backend-api # Set active workstream
/gsdt:workstreams status backend-api # Detailed status
/gsdt:workstreams progress           # Cross-workstream progress overview
/gsdt:workstreams complete backend-api  # Archive completed workstream
/gsdt:workstreams resume backend-api    # Resume work in workstream
```

---

## Configuration Commands

### `/gsdt:settings`

Interactive configuration of workflow toggles and model profile.

```bash
/gsdt:settings                       # Interactive config
```

### `/gsdt:set-profile`

Quick profile switch.

| Argument | Required | Description |
|----------|----------|-------------|
| `profile` | **Yes** | `quality`, `balanced`, `budget`, or `inherit` |

```bash
/gsdt:set-profile budget             # Switch to budget profile
/gsdt:set-profile quality            # Switch to quality profile
```

---

## Brownfield Commands

### `/gsdt:map-codebase`

Analyze existing codebase with parallel mapper agents.

| Argument | Required | Description |
|----------|----------|-------------|
| `area` | No | Scope mapping to a specific area |

```bash
/gsdt:map-codebase                   # Full codebase analysis
/gsdt:map-codebase auth              # Focus on auth area
```

---

## Update Commands

### `/gsdt:update`

Update GSDT with changelog preview.

```bash
/gsdt:update                         # Check for updates and install
```

### `/gsdt:reapply-patches`

Restore local modifications after a GSDT update.

```bash
/gsdt:reapply-patches                # Merge back local changes
```

---

## Fast & Inline Commands

### `/gsdt:fast`

Execute a trivial task inline — no subagents, no planning overhead. For typo fixes, config changes, small refactors, forgotten commits.

| Argument | Required | Description |
|----------|----------|-------------|
| `task description` | No | What to do (prompted if omitted) |

**Not a replacement for `/gsdt:quick`** — use `/gsdt:quick` for anything needing research, multi-step planning, or verification.

```bash
/gsdt:fast "fix typo in README"
/gsdt:fast "add .env to gitignore"
```

---

## Code Quality Commands

### `/gsdt:review`

Cross-AI peer review of phase plans from external AI CLIs.

| Argument | Required | Description |
|----------|----------|-------------|
| `--phase N` | **Yes** | Phase number to review |

| Flag | Description |
|------|-------------|
| `--gemini` | Include Gemini CLI review |
| `--claude` | Include Claude CLI review (separate session) |
| `--codex` | Include Codex CLI review |
| `--all` | Include all available CLIs |

**Produces:** `{phase}-REVIEWS.md` — consumable by `/gsdt:plan-phase --reviews`

```bash
/gsdt:review --phase 3 --all
/gsdt:review --phase 2 --gemini
```

---

### `/gsdt:pr-branch`

Create a clean PR branch by filtering out `.claude/.gsdt-planning/` commits.

| Argument | Required | Description |
|----------|----------|-------------|
| `target branch` | No | Base branch (default: `main`) |

**Purpose:** Reviewers see only code changes, not GSDT planning artifacts.

```bash
/gsdt:pr-branch                     # Filter against main
/gsdt:pr-branch develop             # Filter against develop
```

---

### `/gsdt:audit-uat`

Cross-phase audit of all outstanding UAT and verification items.

**Prerequisites:** At least one phase has been executed with UAT or verification
**Produces:** Categorized audit report with human test plan

```bash
/gsdt:audit-uat
```

---

## Backlog & Thread Commands

### `/gsdt:add-backlog`

Add an idea to the backlog parking lot using 999.x numbering.

| Argument | Required | Description |
|----------|----------|-------------|
| `description` | **Yes** | Backlog item description |

**999.x numbering** keeps backlog items outside the active phase sequence. Phase directories are created immediately so `/gsdt:discuss-phase` and `/gsdt:plan-phase` work on them.

```bash
/gsdt:add-backlog "GraphQL API layer"
/gsdt:add-backlog "Mobile responsive redesign"
```

---

### `/gsdt:review-backlog`

Review and promote backlog items to active milestone.

**Actions per item:** Promote (move to active sequence), Keep (leave in backlog), Remove (delete).

```bash
/gsdt:review-backlog
```

---

### `/gsdt:plant-seed`

Capture a forward-looking idea with trigger conditions — surfaces automatically at the right milestone.

| Argument | Required | Description |
|----------|----------|-------------|
| `idea summary` | No | Seed description (prompted if omitted) |

Seeds solve context rot: instead of a one-liner in Deferred that nobody reads, a seed preserves the full WHY, WHEN to surface, and breadcrumbs to details.

**Produces:** `.claude/.gsdt-planning/seeds/SEED-NNN-slug.md`
**Consumed by:** `/gsdt:new-milestone` (scans seeds and presents matches)

```bash
/gsdt:plant-seed "Add real-time collaboration when WebSocket infra is in place"
```

---

### `/gsdt:thread`

Manage persistent context threads for cross-session work.

| Argument | Required | Description |
|----------|----------|-------------|
| (none) | — | List all threads |
| `name` | — | Resume existing thread by name |
| `description` | — | Create new thread |

Threads are lightweight cross-session knowledge stores for work that spans multiple sessions but doesn't belong to any specific phase. Lighter weight than `/gsdt:pause-work`.

```bash
/gsdt:thread                         # List all threads
/gsdt:thread fix-deploy-key-auth     # Resume thread
/gsdt:thread "Investigate TCP timeout in pasta service"  # Create new
```

---

## Community Commands

### `/gsdt:join-discord`

Open Discord community invite.

```bash
/gsdt:join-discord
```
