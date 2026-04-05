<purpose>
Display the complete GSD command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

<reference>
# GSD Command Reference

**GSD** (Get Shit Done) creates hierarchical project plans optimized for solo agentic development with Claude Code.

## Quick Start

1. `/gsdt:auto 我想做一个...` - One-click automatic flow (capture -> decide -> initialize/plan)
2. `/gsdt:plan-phase 1` - Create detailed plan for first phase
3. `/gsdt:execute-phase 1` - Execute the phase

## Staying Updated

GSD evolves fast. Update periodically:

```bash
npx gsdt@latest
```

## Core Workflow

```
/gsdt:auto → /gsdt:plan-phase → /gsdt:execute-phase → repeat
```

### Project Initialization

**`/gsdt:auto <idea>`**
Default simplified entrypoint.

- Natural language in, no command routing overhead
- Automatically captures fragments and decides next action
- Cold start auto-triggers `new-project --auto` when thresholds are met
- After roadmap exists, auto-advances into discuss/plan chain

Usage: `/gsdt:auto 我想做一个多 Agent 协作工具`

**`/gsdt:new-project`**
Initialize new project through unified flow.

One command takes you from idea to ready-for-planning:
- Deep questioning to understand what you're building
- Optional domain research (spawns 4 parallel researcher agents)
- Requirements definition with v1/v2/out-of-scope scoping
- Roadmap creation with phase breakdown and success criteria

Creates all `.gsdt-planning/` artifacts:
- `PROJECT.md` — vision and requirements
- `config.json` — workflow mode (interactive/yolo)
- `research/` — domain research (if selected)
- `REQUIREMENTS.md` — scoped requirements with REQ-IDs
- `ROADMAP.md` — phases mapped to requirements
- `STATE.md` — project memory

Usage: `/gsdt:new-project` (advanced/manual entrypoint)

**`/gsdt:map-codebase`**
Map an existing codebase for brownfield projects.

- Analyzes codebase with parallel Explore agents
- Creates `.gsdt-planning/codebase/` with 7 focused documents
- Covers stack, architecture, structure, conventions, testing, integrations, concerns
- Use before `/gsdt:new-project` on existing codebases

Usage: `/gsdt:map-codebase`

### Phase Planning

**`/gsdt:discuss-phase <number>`**
Help articulate your vision for a phase before planning.

- Captures how you imagine this phase working
- Creates CONTEXT.md with your vision, essentials, and boundaries
- Use when you have ideas about how something should look/feel
- Optional `--batch` asks 2-5 related questions at a time instead of one-by-one

Usage: `/gsdt:discuss-phase 2`
Usage: `/gsdt:discuss-phase 2 --batch`
Usage: `/gsdt:discuss-phase 2 --batch=3`

**`/gsdt:research-phase <number>`**
Comprehensive ecosystem research for niche/complex domains.

- Discovers standard stack, architecture patterns, pitfalls
- Creates RESEARCH.md with "how experts build this" knowledge
- Use for 3D, games, audio, shaders, ML, and other specialized domains
- Goes beyond "which library" to ecosystem knowledge

Usage: `/gsdt:research-phase 3`

**`/gsdt:list-phase-assumptions <number>`**
See what Claude is planning to do before it starts.

- Shows Claude's intended approach for a phase
- Lets you course-correct if Claude misunderstood your vision
- No files created - conversational output only

Usage: `/gsdt:list-phase-assumptions 3`

**`/gsdt:plan-phase <number>`**
Create detailed execution plan for a specific phase.

- Generates `.gsdt-planning/phases/XX-phase-name/XX-YY-PLAN.md`
- Breaks phase into concrete, actionable tasks
- Includes verification criteria and success measures
- Multiple plans per phase supported (XX-01, XX-02, etc.)

Usage: `/gsdt:plan-phase 1`
Result: Creates `.gsdt-planning/phases/01-foundation/01-01-PLAN.md`

**PRD Express Path:** Pass `--prd path/to/requirements.md` to skip discuss-phase entirely. Your PRD becomes locked decisions in CONTEXT.md. Useful when you already have clear acceptance criteria.

### Execution

**`/gsdt:execute-phase <phase-number>`**
Execute all plans in a phase, or run a specific wave.

- Groups plans by wave (from frontmatter), executes waves sequentially
- Plans within each wave run in parallel via Task tool
- Optional `--wave N` flag executes only Wave `N` and stops unless the phase is now fully complete
- Verifies phase goal after all plans complete
- Updates REQUIREMENTS.md, ROADMAP.md, STATE.md

Usage: `/gsdt:execute-phase 5`
Usage: `/gsdt:execute-phase 5 --wave 2`

### Smart Router

**`/gsdt:do <description>`**
Route freeform text to the right GSD command automatically.

- Analyzes natural language input to find the best matching GSD command
- Acts as a dispatcher — never does the work itself
- Resolves ambiguity by asking you to pick between top matches
- Use when you know what you want but don't know which `/gsdt:*` command to run

Usage: `/gsdt:do fix the login button`
Usage: `/gsdt:do refactor the auth system`
Usage: `/gsdt:do I want to start a new milestone`

### Quick Mode

**`/gsdt:quick [--full] [--discuss] [--research]`**
Execute small, ad-hoc tasks with GSD guarantees but skip optional agents.

Quick mode uses the same system with a shorter path:
- Spawns planner + executor (skips researcher, checker, verifier by default)
- Quick tasks live in `.gsdt-planning/quick/` separate from planned phases
- Updates STATE.md tracking (not ROADMAP.md)

Flags enable additional quality steps:
- `--discuss` — Lightweight discussion to surface gray areas before planning
- `--research` — Focused research agent investigates approaches before planning
- `--full` — Adds plan-checking (max 2 iterations) and post-execution verification

Flags are composable: `--discuss --research --full` gives the complete quality pipeline for a single task.

Usage: `/gsdt:quick`
Usage: `/gsdt:quick --research --full`
Result: Creates `.gsdt-planning/quick/NNN-slug/PLAN.md`, `.gsdt-planning/quick/NNN-slug/SUMMARY.md`

---

**`/gsdt:fast [description]`**
Execute a trivial task inline — no subagents, no planning files, no overhead.

For tasks too small to justify planning: typo fixes, config changes, forgotten commits, simple additions. Runs in the current context, makes the change, commits, and logs to STATE.md.

- No PLAN.md or SUMMARY.md created
- No subagent spawned (runs inline)
- ≤ 3 file edits — redirects to `/gsdt:quick` if task is non-trivial
- Atomic commit with conventional message

Usage: `/gsdt:fast "fix the typo in README"`
Usage: `/gsdt:fast "add .env to gitignore"`

### Roadmap Management

**`/gsdt:add-phase <description>`**
Add new phase to end of current milestone.

- Appends to ROADMAP.md
- Uses next sequential number
- Updates phase directory structure

Usage: `/gsdt:add-phase "Add admin dashboard"`

**`/gsdt:insert-phase <after> <description>`**
Insert urgent work as decimal phase between existing phases.

- Creates intermediate phase (e.g., 7.1 between 7 and 8)
- Useful for discovered work that must happen mid-milestone
- Maintains phase ordering

Usage: `/gsdt:insert-phase 7 "Fix critical auth bug"`
Result: Creates Phase 7.1

**`/gsdt:remove-phase <number>`**
Remove a future phase and renumber subsequent phases.

- Deletes phase directory and all references
- Renumbers all subsequent phases to close the gap
- Only works on future (unstarted) phases
- Git commit preserves historical record

Usage: `/gsdt:remove-phase 17`
Result: Phase 17 deleted, phases 18-20 become 17-19

### Milestone Management

**`/gsdt:new-milestone <name>`**
Start a new milestone through unified flow.

- Deep questioning to understand what you're building next
- Optional domain research (spawns 4 parallel researcher agents)
- Requirements definition with scoping
- Roadmap creation with phase breakdown
- Optional `--reset-phase-numbers` flag restarts numbering at Phase 1 and archives old phase dirs first for safety

Mirrors `/gsdt:new-project` flow for brownfield projects (existing PROJECT.md).

Usage: `/gsdt:new-milestone "v2.0 Features"`
Usage: `/gsdt:new-milestone --reset-phase-numbers "v2.0 Features"`

**`/gsdt:complete-milestone <version>`**
Archive completed milestone and prepare for next version.

- Creates MILESTONES.md entry with stats
- Archives full details to milestones/ directory
- Creates git tag for the release
- Prepares workspace for next version

Usage: `/gsdt:complete-milestone 1.0.0`

### Progress Tracking

**`/gsdt:progress`**
Check project status and intelligently route to next action.

- Shows visual progress bar and completion percentage
- Summarizes recent work from SUMMARY files
- Displays current position and what's next
- Lists key decisions and open issues
- Offers to execute next plan or create it if missing
- Detects 100% milestone completion

Usage: `/gsdt:progress`

### Session Management

**`/gsdt:resume-work`**
Resume work from previous session with full context restoration.

- Reads STATE.md for project context
- Shows current position and recent progress
- Offers next actions based on project state

Usage: `/gsdt:resume-work`

**`/gsdt:pause-work`**
Create context handoff when pausing work mid-phase.

- Creates .continue-here file with current state
- Updates STATE.md session continuity section
- Captures in-progress work context

Usage: `/gsdt:pause-work`

### Debugging

**`/gsdt:debug [issue description]`**
Systematic debugging with persistent state across context resets.

- Gathers symptoms through adaptive questioning
- Creates `.gsdt-planning/debug/[slug].md` to track investigation
- Investigates using scientific method (evidence → hypothesis → test)
- Survives `/clear` — run `/gsdt:debug` with no args to resume
- Archives resolved issues to `.gsdt-planning/debug/resolved/`

Usage: `/gsdt:debug "login button doesn't work"`
Usage: `/gsdt:debug` (resume active session)

### Quick Notes

**`/gsdt:note <text>`**
Zero-friction idea capture — one command, instant save, no questions.

- Saves timestamped note to `.gsdt-planning/notes/` (or `~/.claude/notes/` globally)
- Three subcommands: append (default), list, promote
- Promote converts a note into a structured todo
- Works without a project (falls back to global scope)

Usage: `/gsdt:note refactor the hook system`
Usage: `/gsdt:note list`
Usage: `/gsdt:note promote 3`
Usage: `/gsdt:note --global cross-project idea`

### Todo Management

**`/gsdt:add-todo [description]`**
Capture idea or task as todo from current conversation.

- Extracts context from conversation (or uses provided description)
- Creates structured todo file in `.gsdt-planning/todos/pending/`
- Infers area from file paths for grouping
- Checks for duplicates before creating
- Updates STATE.md todo count

Usage: `/gsdt:add-todo` (infers from conversation)
Usage: `/gsdt:add-todo Add auth token refresh`

**`/gsdt:check-todos [area]`**
List pending todos and select one to work on.

- Lists all pending todos with title, area, age
- Optional area filter (e.g., `/gsdt:check-todos api`)
- Loads full context for selected todo
- Routes to appropriate action (work now, add to phase, brainstorm)
- Moves todo to done/ when work begins

Usage: `/gsdt:check-todos`
Usage: `/gsdt:check-todos api`

### User Acceptance Testing

**`/gsdt:verify-work [phase]`**
Validate built features through conversational UAT.

- Extracts testable deliverables from SUMMARY.md files
- Presents tests one at a time (yes/no responses)
- Automatically diagnoses failures and creates fix plans
- Ready for re-execution if issues found

Usage: `/gsdt:verify-work 3`

### Ship Work

**`/gsdt:ship [phase]`**
Create a PR from completed phase work with an auto-generated body.

- Pushes branch to remote
- Creates PR with summary from SUMMARY.md, VERIFICATION.md, REQUIREMENTS.md
- Optionally requests code review
- Updates STATE.md with shipping status

Prerequisites: Phase verified, `gh` CLI installed and authenticated.

Usage: `/gsdt:ship 4` or `/gsdt:ship 4 --draft`

---

**`/gsdt:review --phase N [--gemini] [--claude] [--codex] [--all]`**
Cross-AI peer review — invoke external AI CLIs to independently review phase plans.

- Detects available CLIs (gemini, claude, codex)
- Each CLI reviews plans independently with the same structured prompt
- Produces REVIEWS.md with per-reviewer feedback and consensus summary
- Feed reviews back into planning: `/gsdt:plan-phase N --reviews`

Usage: `/gsdt:review --phase 3 --all`

---

**`/gsdt:pr-branch [target]`**
Create a clean branch for pull requests by filtering out .gsdt-planning/ commits.

- Classifies commits: code-only (include), planning-only (exclude), mixed (include sans .gsdt-planning/)
- Cherry-picks code commits onto a clean branch
- Reviewers see only code changes, no GSD artifacts

Usage: `/gsdt:pr-branch` or `/gsdt:pr-branch main`

---

**`/gsdt:plant-seed [idea]`**
Capture a forward-looking idea with trigger conditions for automatic surfacing.

- Seeds preserve WHY, WHEN to surface, and breadcrumbs to related code
- Auto-surfaces during `/gsdt:new-milestone` when trigger conditions match
- Better than deferred items — triggers are checked, not forgotten

Usage: `/gsdt:plant-seed "add real-time notifications when we build the events system"`

---

**`/gsdt:audit-uat`**
Cross-phase audit of all outstanding UAT and verification items.
- Scans every phase for pending, skipped, blocked, and human_needed items
- Cross-references against codebase to detect stale documentation
- Produces prioritized human test plan grouped by testability
- Use before starting a new milestone to clear verification debt

Usage: `/gsdt:audit-uat`

### Milestone Auditing

**`/gsdt:audit-milestone [version]`**
Audit milestone completion against original intent.

- Reads all phase VERIFICATION.md files
- Checks requirements coverage
- Spawns integration checker for cross-phase wiring
- Creates MILESTONE-AUDIT.md with gaps and tech debt

Usage: `/gsdt:audit-milestone`

**`/gsdt:plan-milestone-gaps`**
Create phases to close gaps identified by audit.

- Reads MILESTONE-AUDIT.md and groups gaps into phases
- Prioritizes by requirement priority (must/should/nice)
- Adds gap closure phases to ROADMAP.md
- Ready for `/gsdt:plan-phase` on new phases

Usage: `/gsdt:plan-milestone-gaps`

### Configuration

**`/gsdt:settings`**
Configure workflow toggles and model profile interactively.

- Toggle researcher, plan checker, verifier agents
- Select model profile (quality/balanced/budget/inherit)
- Updates `.gsdt-planning/config.json`

Usage: `/gsdt:settings`

**`/gsdt:set-profile <profile>`**
Quick switch model profile for GSD agents.

- `quality` — Opus everywhere except verification
- `balanced` — Opus for planning, Sonnet for execution (default)
- `budget` — Sonnet for writing, Haiku for research/verification
- `inherit` — Use current session model for all agents (Vibe Agent Team / opencode-style `/model`)

Usage: `/gsdt:set-profile budget`

### Utility Commands

**`/gsdt:cleanup`**
Archive accumulated phase directories from completed milestones.

- Identifies phases from completed milestones still in `.gsdt-planning/phases/`
- Shows dry-run summary before moving anything
- Moves phase dirs to `.gsdt-planning/milestones/v{X.Y}-phases/`
- Use after multiple milestones to reduce `.gsdt-planning/phases/` clutter

Usage: `/gsdt:cleanup`

**`/gsdt:help`**
Show this command reference.

**`/gsdt:update`**
Update GSD to latest version with changelog preview.

- Shows installed vs latest version comparison
- Displays changelog entries for versions you've missed
- Highlights breaking changes
- Confirms before running install
- Better than raw `npx gsdt`

Usage: `/gsdt:update`

**`/gsdt:join-discord`**
Join the GSD Discord community.

- Get help, share what you're building, stay updated
- Connect with other GSD users

Usage: `/gsdt:join-discord`

## Files & Structure

```
.gsdt-planning/
├── PROJECT.md            # Project vision
├── ROADMAP.md            # Current phase breakdown
├── STATE.md              # Project memory & context
├── RETROSPECTIVE.md      # Living retrospective (updated per milestone)
├── config.json           # Workflow mode & gates
├── todos/                # Captured ideas and tasks
│   ├── pending/          # Todos waiting to be worked on
│   └── done/             # Completed todos
├── debug/                # Active debug sessions
│   └── resolved/         # Archived resolved issues
├── milestones/
│   ├── v1.0-ROADMAP.md       # Archived roadmap snapshot
│   ├── v1.0-REQUIREMENTS.md  # Archived requirements
│   └── v1.0-phases/          # Archived phase dirs (via /gsdt:cleanup or --archive-phases)
│       ├── 01-foundation/
│       └── 02-core-features/
├── codebase/             # Codebase map (brownfield projects)
│   ├── STACK.md          # Languages, frameworks, dependencies
│   ├── ARCHITECTURE.md   # Patterns, layers, data flow
│   ├── STRUCTURE.md      # Directory layout, key files
│   ├── CONVENTIONS.md    # Coding standards, naming
│   ├── TESTING.md        # Test setup, patterns
│   ├── INTEGRATIONS.md   # External services, APIs
│   └── CONCERNS.md       # Tech debt, known issues
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-core-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

## Workflow Modes

Set during `/gsdt:auto` (which auto-triggers `/gsdt:new-project`) or direct `/gsdt:new-project`:

**Interactive Mode**

- Confirms each major decision
- Pauses at checkpoints for approval
- More guidance throughout

**YOLO Mode**

- Auto-approves most decisions
- Executes plans without confirmation
- Only stops for critical checkpoints

Change anytime by editing `.gsdt-planning/config.json`

## Planning Configuration

Configure how planning artifacts are managed in `.gsdt-planning/config.json`:

**`planning.commit_docs`** (default: `true`)
- `true`: Planning artifacts committed to git (standard workflow)
- `false`: Planning artifacts kept local-only, not committed

When `commit_docs: false`:
- Add `.gsdt-planning/` to your `.gitignore`
- Useful for OSS contributions, client projects, or keeping planning private
- All planning files still work normally, just not tracked in git

**`planning.search_gitignored`** (default: `false`)
- `true`: Add `--no-ignore` to broad ripgrep searches
- Only needed when `.gsdt-planning/` is gitignored and you want project-wide searches to include it

Example config:
```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## Common Workflows

**Starting a new project:**

```
/gsdt:auto 我想做一个...   # One-click automatic start
/clear
/gsdt:plan-phase 1       # Create plans for first phase
/clear
/gsdt:execute-phase 1    # Execute all plans in phase
```

**Resuming work after a break:**

```
/gsdt:progress  # See where you left off and continue
```

**Adding urgent mid-milestone work:**

```
/gsdt:insert-phase 5 "Critical security fix"
/gsdt:plan-phase 5.1
/gsdt:execute-phase 5.1
```

**Completing a milestone:**

```
/gsdt:complete-milestone 1.0.0
/clear
/gsdt:new-milestone  # Start next milestone (questioning → research → requirements → roadmap)
```

**Capturing ideas during work:**

```
/gsdt:add-todo                    # Capture from conversation context
/gsdt:add-todo Fix modal z-index  # Capture with explicit description
/gsdt:check-todos                 # Review and work on todos
/gsdt:check-todos api             # Filter by area
```

**Debugging an issue:**

```
/gsdt:debug "form submission fails silently"  # Start debug session
# ... investigation happens, context fills up ...
/clear
/gsdt:debug                                    # Resume from where you left off
```

## Getting Help

- Read `.gsdt-planning/PROJECT.md` for project vision
- Read `.gsdt-planning/STATE.md` for current context
- Check `.gsdt-planning/ROADMAP.md` for phase status
- Run `/gsdt:progress` to check where you're up to
</reference>
