# GSDT Feature Reference

> Complete feature and function documentation with requirements. For architecture details, see [Architecture](ARCHITECTURE.md). For command syntax, see [Command Reference](COMMANDS.md).

---

## Table of Contents

- [GSDT Feature Reference](#gsdt-feature-reference)
  - [Table of Contents](#table-of-contents)
  - [Core Features](#core-features)
    - [1. Project Initialization](#1-project-initialization)
    - [2. Phase Discussion](#2-phase-discussion)
    - [3. UI Design Contract](#3-ui-design-contract)
    - [4. Phase Planning](#4-phase-planning)
    - [5. Phase Execution](#5-phase-execution)
    - [6. Work Verification](#6-work-verification)
    - [6.5. Ship](#65-ship)
    - [7. UI Review](#7-ui-review)
    - [8. Milestone Management](#8-milestone-management)
  - [Planning Features](#planning-features)
    - [9. Phase Management](#9-phase-management)
    - [10. Quick Mode](#10-quick-mode)
    - [11. Autonomous Mode](#11-autonomous-mode)
    - [12. Freeform Routing](#12-freeform-routing)
    - [12.5 Semantic Intake](#125-semantic-intake)
    - [13. Note Capture](#13-note-capture)
    - [14. Auto-Advance (Next)](#14-auto-advance-next)
  - [Quality Assurance Features](#quality-assurance-features)
    - [15. Nyquist Validation](#15-nyquist-validation)
    - [16. Plan Checking](#16-plan-checking)
    - [17. Post-Execution Verification](#17-post-execution-verification)
    - [18. Node Repair](#18-node-repair)
    - [19. Health Validation](#19-health-validation)
    - [20. Cross-Phase Regression Gate](#20-cross-phase-regression-gate)
    - [21. Requirements Coverage Gate](#21-requirements-coverage-gate)
  - [Context Engineering Features](#context-engineering-features)
    - [22. Context Window Monitoring](#22-context-window-monitoring)
    - [23. Session Management](#23-session-management)
    - [24. Session Reporting](#24-session-reporting)
    - [25. Multi-Agent Orchestration](#25-multi-agent-orchestration)
    - [26. Model Profiles](#26-model-profiles)
  - [Brownfield Features](#brownfield-features)
    - [27. Codebase Mapping](#27-codebase-mapping)
  - [Utility Features](#utility-features)
    - [28. Debug System](#28-debug-system)
    - [29. Todo Management](#29-todo-management)
    - [30. Statistics Dashboard](#30-statistics-dashboard)
    - [31. Update System](#31-update-system)
    - [32. Settings Management](#32-settings-management)
    - [33. Test Generation](#33-test-generation)
  - [Infrastructure Features](#infrastructure-features)
    - [34. Git Integration](#34-git-integration)
    - [35. CLI Tools](#35-cli-tools)
    - [36. Multi-Runtime Support](#36-multi-runtime-support)
    - [37. Hook System](#37-hook-system)
    - [38. Developer Profiling](#38-developer-profiling)
    - [39. Execution Hardening](#39-execution-hardening)
    - [40. Verification Debt Tracking](#40-verification-debt-tracking)
  - [v1.27 Features](#v127-features)
    - [41. Fast Mode](#41-fast-mode)
    - [42. Cross-AI Peer Review](#42-cross-ai-peer-review)
    - [43. Backlog Parking Lot](#43-backlog-parking-lot)
    - [44. Persistent Context Threads](#44-persistent-context-threads)
    - [45. PR Branch Filtering](#45-pr-branch-filtering)
    - [46. Security Hardening](#46-security-hardening)
    - [47. Multi-Repo Workspace Support](#47-multi-repo-workspace-support)
    - [48. Discussion Audit Trail](#48-discussion-audit-trail)
  - [v1.28 Features](#v128-features)
    - [49. Forensics](#49-forensics)
    - [50. Milestone Summary](#50-milestone-summary)
    - [51. Workstream Namespacing](#51-workstream-namespacing)
    - [52. Manager Dashboard](#52-manager-dashboard)
    - [53. Assumptions Discussion Mode](#53-assumptions-discussion-mode)
    - [54. UI Phase Auto-Detection](#54-ui-phase-auto-detection)
    - [55. Multi-Runtime Installer Selection](#55-multi-runtime-installer-selection)

---

## Core Features

### 1. Project Initialization

**Command:** `/gsdt:new-project [--auto @file.md]`

**Purpose:** Transform a user's idea into a fully structured project with research, scoped requirements, and a phased roadmap.

**Requirements:**
- REQ-INIT-01: System MUST conduct adaptive questioning until project scope is fully understood
- REQ-INIT-02: System MUST spawn parallel research agents to investigate the domain ecosystem
- REQ-INIT-03: System MUST extract requirements into v1 (must-have), v2 (future), and out-of-scope categories
- REQ-INIT-04: System MUST generate a phased roadmap with requirement traceability
- REQ-INIT-05: System MUST require user approval of the roadmap before proceeding
- REQ-INIT-06: System MUST prevent re-initialization when `.gsdt-planning/PROJECT.md` already exists
- REQ-INIT-07: System MUST support `--auto @file.md` flag to skip interactive questions and extract from a document

**Produces:**
| Artifact | Description |
|----------|-------------|
| `PROJECT.md` | Project vision, constraints, technical decisions, evolution rules |
| `REQUIREMENTS.md` | Scoped requirements with unique IDs (REQ-XX) |
| `ROADMAP.md` | Phase breakdown with status tracking and requirement mapping |
| `STATE.md` | Initial project state with position, decisions, metrics |
| `config.json` | Workflow configuration |
| `research/SUMMARY.md` | Synthesized domain research |
| `research/STACK.md` | Technology stack investigation |
| `research/FEATURES.md` | Feature implementation patterns |
| `research/ARCHITECTURE.md` | Architecture patterns and trade-offs |
| `research/PITFALLS.md` | Common failure modes and mitigations |

**Process:**
1. **Questions** — Adaptive questioning guided by the "dream extraction" philosophy (not requirements gathering)
2. **Research** — 4 parallel researcher agents investigate stack, features, architecture, and pitfalls
3. **Synthesis** — Research synthesizer combines findings into SUMMARY.md
4. **Requirements** — Extracted from user responses + research, categorized by scope
5. **Roadmap** — Phase breakdown mapped to requirements, with granularity setting controlling phase count

**Functional Requirements:**
- Questions adapt based on detected project type (web app, CLI, mobile, API, etc.)
- Research agents have web search capability for current ecosystem information
- Granularity setting controls phase count: `coarse` (3-5), `standard` (5-8), `fine` (8-12)
- `--auto` mode extracts all information from the provided document without interactive questioning
- Existing codebase context (from `/gsdt:map-codebase`) is loaded if present

---

### 2. Phase Discussion

**Command:** `/gsdt:discuss-phase [N] [--auto] [--batch]`

**Purpose:** Capture user's implementation preferences and decisions before research and planning begin. Eliminates the gray areas that cause AI to guess.

**Requirements:**
- REQ-DISC-01: System MUST analyze the phase scope and identify decision areas (gray areas)
- REQ-DISC-02: System MUST categorize gray areas by type (visual, API, content, organization, etc.)
- REQ-DISC-03: System MUST ask only questions not already answered in prior CONTEXT.md files
- REQ-DISC-04: System MUST persist decisions in `{phase}-CONTEXT.md` with canonical references
- REQ-DISC-05: System MUST support `--auto` flag to auto-select recommended defaults
- REQ-DISC-06: System MUST support `--batch` flag for grouped question intake
- REQ-DISC-07: System MUST scout relevant source files before identifying gray areas (code-aware discussion)

**Produces:** `{padded_phase}-CONTEXT.md` — User preferences that feed into research and planning

**Gray Area Categories:**
| Category | Example Decisions |
|----------|-------------------|
| Visual features | Layout, density, interactions, empty states |
| APIs/CLIs | Response format, flags, error handling, verbosity |
| Content systems | Structure, tone, depth, flow |
| Organization | Grouping criteria, naming, duplicates, exceptions |

---

### 3. UI Design Contract

**Command:** `/gsdt:ui-phase [N]`

**Purpose:** Lock design decisions before planning so that all components in a phase share consistent visual standards.

**Requirements:**
- REQ-UI-01: System MUST detect existing design system state (shadcn components.json, Tailwind config, tokens)
- REQ-UI-02: System MUST ask only unanswered design contract questions
- REQ-UI-03: System MUST validate against 6 dimensions (Copywriting, Visuals, Color, Typography, Spacing, Registry Safety)
- REQ-UI-04: System MUST enter revision loop if validation returns BLOCKED (max 2 iterations)
- REQ-UI-05: System MUST offer shadcn initialization for React/Next.js/Vite projects without `components.json`
- REQ-UI-06: System MUST enforce registry safety gate for third-party shadcn registries

**Produces:** `{padded_phase}-UI-SPEC.md` — Design contract consumed by executors

**6 Validation Dimensions:**
1. **Copywriting** — CTA labels, empty states, error messages
2. **Visuals** — Focal points, visual hierarchy, icon accessibility
3. **Color** — Accent usage discipline, 60/30/10 compliance
4. **Typography** — Font size/weight constraint adherence
5. **Spacing** — Grid alignment, token consistency
6. **Registry Safety** — Third-party component inspection requirements

**shadcn Integration:**
- Detects missing `components.json` in React/Next.js/Vite projects
- Guides user through `ui.shadcn.com/create` preset configuration
- Preset string becomes a planning artifact reproducible across phases
- Safety gate requires `npx shadcn view` and `npx shadcn diff` before third-party components

---

### 4. Phase Planning

**Command:** `/gsdt:plan-phase [N] [--auto] [--skip-research] [--skip-verify]`

**Purpose:** Research the implementation domain and produce verified, atomic execution plans.

**Requirements:**
- REQ-PLAN-01: System MUST spawn a phase researcher to investigate implementation approaches
- REQ-PLAN-02: System MUST produce plans with 2-3 tasks each, sized for a single context window
- REQ-PLAN-03: System MUST structure plans as XML with `<task>` elements containing `name`, `files`, `action`, `verify`, and `done` fields
- REQ-PLAN-04: System MUST include `read_first` and `acceptance_criteria` sections in every plan
- REQ-PLAN-05: System MUST run plan checker verification loop (up to 3 iterations) unless `--skip-verify` is set
- REQ-PLAN-06: System MUST support `--skip-research` flag to bypass research phase
- REQ-PLAN-07: System MUST prompt user to run `/gsdt:ui-phase` if frontend phase detected and no UI-SPEC.md exists (UI safety gate)
- REQ-PLAN-08: System MUST include Nyquist validation mapping when `workflow.nyquist_validation` is enabled
- REQ-PLAN-09: System MUST verify all phase requirements are covered by at least one plan before planning completes (requirements coverage gate)

**Produces:**
| Artifact | Description |
|----------|-------------|
| `{phase}-RESEARCH.md` | Ecosystem research findings |
| `{phase}-{N}-PLAN.md` | Atomic execution plans (2-3 tasks each) |
| `{phase}-VALIDATION.md` | Test coverage mapping (Nyquist layer) |

**Plan Structure (XML):**
```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT. Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

**Plan Checker Verification (8 Dimensions):**
1. Requirement coverage — Plans address all phase requirements
2. Task atomicity — Each task is independently committable
3. Dependency ordering — Tasks sequence correctly
4. File scope — No excessive file overlap between plans
5. Verification commands — Each task has testable done criteria
6. Context fit — Tasks fit within a single context window
7. Gap detection — No missing implementation steps
8. Nyquist compliance — Tasks have automated verify commands (when enabled)

---

### 5. Phase Execution

**Command:** `/gsdt:execute-phase <N>`

**Purpose:** Execute all plans in a phase using wave-based parallelization with fresh context windows per executor.

**Requirements:**
- REQ-EXEC-01: System MUST analyze plan dependencies and group into execution waves
- REQ-EXEC-02: System MUST spawn independent plans in parallel within each wave
- REQ-EXEC-03: System MUST give each executor a fresh context window (200K tokens)
- REQ-EXEC-04: System MUST produce atomic git commits per task
- REQ-EXEC-05: System MUST produce a SUMMARY.md for each completed plan
- REQ-EXEC-06: System MUST run post-execution verifier to check phase goals were met
- REQ-EXEC-07: System MUST support git branching strategies (`none`, `phase`, `milestone`)
- REQ-EXEC-08: System MUST invoke node repair operator on task verification failure (when enabled)
- REQ-EXEC-09: System MUST run prior phases' test suites before verification to catch cross-phase regressions

**Produces:**
| Artifact | Description |
|----------|-------------|
| `{phase}-{N}-SUMMARY.md` | Execution outcomes per plan |
| `{phase}-VERIFICATION.md` | Post-execution verification report |
| Git commits | Atomic commits per task |

**Wave Execution:**
- Plans with no dependencies → Wave 1 (parallel)
- Plans depending on Wave 1 → Wave 2 (parallel, waits for Wave 1)
- Continues until all plans complete
- File conflicts force sequential execution within same wave

**Executor Capabilities:**
- Reads PLAN.md with full task instructions
- Has access to PROJECT.md, STATE.md, CONTEXT.md, RESEARCH.md
- Commits each task atomically with structured commit messages
- Uses `--no-verify` on commits during parallel execution to avoid build lock contention
- Handles checkpoint types: `auto`, `checkpoint:human-verify`, `checkpoint:decision`, `checkpoint:human-action`
- Reports deviations from plan in SUMMARY.md

**Parallel Safety:**
- **Pre-commit hooks**: Skipped by parallel agents (`--no-verify`), run once by orchestrator after each wave
- **STATE.md locking**: File-level lockfile prevents concurrent write corruption across agents

---

### 6. Work Verification

**Command:** `/gsdt:verify-work [N]`

**Purpose:** User acceptance testing — walk the user through testing each deliverable and auto-diagnose failures.

**Requirements:**
- REQ-VERIFY-01: System MUST extract testable deliverables from the phase
- REQ-VERIFY-02: System MUST present deliverables one at a time for user confirmation
- REQ-VERIFY-03: System MUST spawn debug agents to diagnose failures automatically
- REQ-VERIFY-04: System MUST create fix plans for identified issues
- REQ-VERIFY-05: System MUST inject cold-start smoke test for phases modifying server/database/seed/startup files
- REQ-VERIFY-06: System MUST produce UAT.md with pass/fail results

**Produces:** `{phase}-UAT.md` — User acceptance test results, plus fix plans if issues found

---

### 6.5. Ship

**Command:** `/gsdt:ship [N] [--draft]`

**Purpose:** Bridge local completion → merged PR. After verification passes, push branch, create PR with auto-generated body from planning artifacts, optionally trigger review, and track in STATE.md.

**Requirements:**
- REQ-SHIP-01: System MUST verify phase has passed verification before shipping
- REQ-SHIP-02: System MUST push branch and create PR via `gh` CLI
- REQ-SHIP-03: System MUST auto-generate PR body from SUMMARY.md, VERIFICATION.md, and REQUIREMENTS.md
- REQ-SHIP-04: System MUST update STATE.md with shipping status and PR number
- REQ-SHIP-05: System MUST support `--draft` flag for draft PRs

**Prerequisites:** Phase verified, `gh` CLI installed and authenticated, work on feature branch

**Produces:** GitHub PR with rich body, STATE.md updated

---

### 7. UI Review

**Command:** `/gsdt:ui-review [N]`

**Purpose:** Retroactive 6-pillar visual audit of implemented frontend code. Works standalone on any project.

**Requirements:**
- REQ-UIREVIEW-01: System MUST score each of the 6 pillars on a 1-4 scale
- REQ-UIREVIEW-02: System MUST capture screenshots via Playwright CLI to `.gsdt-planning/ui-reviews/`
- REQ-UIREVIEW-03: System MUST create `.gitignore` for screenshot directory
- REQ-UIREVIEW-04: System MUST identify top 3 priority fixes
- REQ-UIREVIEW-05: System MUST work standalone (without UI-SPEC.md) using abstract quality standards

**6 Audit Pillars (scored 1-4):**
1. **Copywriting** — CTA labels, empty states, error states
2. **Visuals** — Focal points, visual hierarchy, icon accessibility
3. **Color** — Accent usage discipline, 60/30/10 compliance
4. **Typography** — Font size/weight constraint adherence
5. **Spacing** — Grid alignment, token consistency
6. **Experience Design** — Loading/error/empty state coverage

**Produces:** `{padded_phase}-UI-REVIEW.md` — Scores and prioritized fixes

---

### 8. Milestone Management

**Commands:** `/gsdt:audit-milestone`, `/gsdt:complete-milestone`, `/gsdt:new-milestone [name]`

**Purpose:** Verify milestone completion, archive, tag release, and start the next development cycle.

**Requirements:**
- REQ-MILE-01: Audit MUST verify all milestone requirements are met
- REQ-MILE-02: Audit MUST detect stubs, placeholder implementations, and untested code
- REQ-MILE-03: Audit MUST check Nyquist validation compliance across phases
- REQ-MILE-04: Complete MUST archive milestone data to MILESTONES.md
- REQ-MILE-05: Complete MUST offer git tag creation for the release
- REQ-MILE-06: Complete MUST offer squash merge or merge with history for branching strategies
- REQ-MILE-07: Complete MUST clean up UI review screenshots
- REQ-MILE-08: New milestone MUST follow same flow as new-project (questions → research → requirements → roadmap)
- REQ-MILE-09: New milestone MUST NOT reset existing workflow configuration

**Gap Closure:** `/gsdt:plan-milestone-gaps` creates phases to close gaps identified by audit.

---

## Planning Features

### 9. Phase Management

**Commands:** `/gsdt:add-phase`, `/gsdt:insert-phase [N]`, `/gsdt:remove-phase [N]`

**Purpose:** Dynamic roadmap modification during development.

**Requirements:**
- REQ-PHASE-01: Add MUST append a new phase to the end of the current roadmap
- REQ-PHASE-02: Insert MUST use decimal numbering (e.g., 3.1) between existing phases
- REQ-PHASE-03: Remove MUST renumber all subsequent phases
- REQ-PHASE-04: Remove MUST prevent removing phases that have been executed
- REQ-PHASE-05: All operations MUST update ROADMAP.md and create/remove phase directories

---

### 10. Quick Mode

**Command:** `/gsdt:quick [--full] [--discuss] [--research]`

**Purpose:** Ad-hoc task execution with GSDT guarantees but a faster path.

**Requirements:**
- REQ-QUICK-01: System MUST accept freeform task description
- REQ-QUICK-02: System MUST use same planner + executor agents as full workflow
- REQ-QUICK-03: System MUST skip research, plan checker, and verifier by default
- REQ-QUICK-04: `--full` flag MUST enable plan checking (max 2 iterations) and post-execution verification
- REQ-QUICK-05: `--discuss` flag MUST run lightweight pre-planning discussion
- REQ-QUICK-06: `--research` flag MUST spawn focused research agent before planning
- REQ-QUICK-07: Flags MUST be composable (`--discuss --research --full`)
- REQ-QUICK-08: System MUST track quick tasks in `.gsdt-planning/quick/YYMMDD-xxx-slug/`
- REQ-QUICK-09: System MUST produce atomic commits for quick task execution

---

### 11. Autonomous Mode

**Command:** `/gsdt:autonomous [--from N]`

**Purpose:** Run all remaining phases autonomously — discuss → plan → execute per phase.

**Requirements:**
- REQ-AUTO-01: System MUST iterate through all incomplete phases in roadmap order
- REQ-AUTO-02: System MUST run discuss → plan → execute for each phase
- REQ-AUTO-03: System MUST pause for explicit user decisions (gray area acceptance, blockers, validation)
- REQ-AUTO-04: System MUST re-read ROADMAP.md after each phase to catch dynamically inserted phases
- REQ-AUTO-05: `--from N` flag MUST start from a specific phase number

---

### 12. Freeform Routing

**Command:** `/gsdt:do`

**Purpose:** Analyze freeform text and route to the appropriate GSDT command.

**Requirements:**
- REQ-DO-01: System MUST parse user intent from natural language input
- REQ-DO-02: System MUST map intent to the best matching GSDT command
- REQ-DO-03: System MUST confirm the routing with the user before executing
- REQ-DO-04: System MUST handle project-exists vs no-project contexts differently
- REQ-DO-05: System SHOULD route weakly structured discovery input to `/gsdt:intake` when semantic normalization is a better fit than direct execution

---

### 12.5 Semantic Intake

**Command:** `/gsdt:intake`

**Purpose:** Quietly transform freeform discovery input into semantic planning units without forcing a PRD, rigid user-story formatting, or interactive questioning.

**Requirements:**
- REQ-INTAKE-01: System MUST persist raw intake fragments under `.claude/.gsdt-intake/raw/`
- REQ-INTAKE-02: System MUST normalize input into `user_story`, `constraint`, `preference`, `technical_enabler`, or `open_question`
- REQ-INTAKE-03: System MUST prefer conservative classification over fabricating user stories from weak evidence
- REQ-INTAKE-04: System MUST use mixed-layered intake semantics where AI recommends semantic resolution/readiness/artifacts and the CLI applies deterministic guards
- REQ-INTAKE-05: System MUST auto-trigger `/gsdt:new-project --auto` only when cold-start semantic readiness is high enough
- REQ-INTAKE-06: System MUST auto-trigger `/gsdt:plan-phase N --prd ...` only when a target phase match is confident and the phase has no existing plans
- REQ-INTAKE-07: System MUST emit a one-line status when confidence is not high enough for automatic routing

---

### 13. Note Capture

**Command:** `/gsdt:note`

**Purpose:** Zero-friction idea capture without interrupting workflow. Append timestamped notes, list all notes, or promote notes to structured todos.

**Requirements:**
- REQ-NOTE-01: System MUST save timestamped note files with a single Write call
- REQ-NOTE-02: System MUST support `list` subcommand to show all notes from project and global scopes
- REQ-NOTE-03: System MUST support `promote N` subcommand to convert a note into a structured todo
- REQ-NOTE-04: System MUST support `--global` flag for global scope operations
- REQ-NOTE-05: System MUST NOT use Task, AskUserQuestion, or Bash — runs inline only

---

### 14. Auto-Advance (Next)

**Command:** `/gsdt:next`

**Purpose:** Automatically detect current project state and advance to the next logical workflow step, eliminating the need to remember which phase/step you're on.

**Requirements:**
- REQ-NEXT-01: System MUST read STATE.md, ROADMAP.md, and phase directories to determine current position
- REQ-NEXT-02: System MUST detect whether discuss, plan, execute, or verify is needed
- REQ-NEXT-03: System MUST invoke the correct command automatically
- REQ-NEXT-04: System MUST suggest `/gsdt:new-project` if no project exists
- REQ-NEXT-05: System MUST suggest `/gsdt:complete-milestone` when all phases are complete

**State Detection Logic:**
| State | Action |
|-------|--------|
| No `.gsdt-planning/` directory | Suggest `/gsdt:new-project` |
| Phase has no CONTEXT.md | Run `/gsdt:discuss-phase` |
| Phase has no PLAN.md files | Run `/gsdt:plan-phase` |
| Phase has plans but no SUMMARY.md | Run `/gsdt:execute-phase` |
| Phase executed but no VERIFICATION.md | Run `/gsdt:verify-work` |
| All phases complete | Suggest `/gsdt:complete-milestone` |

---

## Quality Assurance Features

### 15. Nyquist Validation

**Purpose:** Map automated test coverage to phase requirements before any code is written. Named after the Nyquist sampling theorem — ensures a feedback signal exists for every requirement.

**Requirements:**
- REQ-NYQ-01: System MUST detect existing test infrastructure during plan-phase research
- REQ-NYQ-02: System MUST map each requirement to a specific test command
- REQ-NYQ-03: System MUST identify Wave 0 tasks (test scaffolding needed before implementation)
- REQ-NYQ-04: Plan checker MUST enforce Nyquist compliance as 8th verification dimension
- REQ-NYQ-05: System MUST support retroactive validation via `/gsdt:validate-phase`
- REQ-NYQ-06: System MUST be disableable via `workflow.nyquist_validation: false`

**Produces:** `{phase}-VALIDATION.md` — Test coverage contract

**Retroactive Validation (`/gsdt:validate-phase [N]`):**
- Scans implementation and maps requirements to tests
- Identifies gaps where requirements lack automated verification
- Spawns auditor to generate tests (max 3 attempts)
- Never modifies implementation code — only test files and VALIDATION.md
- Flags implementation bugs as escalations for user to address

---

### 16. Plan Checking

**Purpose:** Goal-backward verification that plans will achieve phase objectives before execution.

**Requirements:**
- REQ-PLANCK-01: System MUST verify plans against 8 quality dimensions
- REQ-PLANCK-02: System MUST loop up to 3 iterations until plans pass
- REQ-PLANCK-03: System MUST produce specific, actionable feedback on failures
- REQ-PLANCK-04: System MUST be disableable via `workflow.plan_check: false`

---

### 17. Post-Execution Verification

**Purpose:** Automated check that the codebase delivers what the phase promised.

**Requirements:**
- REQ-POSTVER-01: System MUST check against phase goals, not just task completion
- REQ-POSTVER-02: System MUST produce VERIFICATION.md with pass/fail analysis
- REQ-POSTVER-03: System MUST log issues for `/gsdt:verify-work` to address
- REQ-POSTVER-04: System MUST be disableable via `workflow.verifier: false`

---

### 18. Node Repair

**Purpose:** Autonomous recovery when task verification fails during execution.

**Requirements:**
- REQ-REPAIR-01: System MUST analyze failure and choose one strategy: RETRY, DECOMPOSE, or PRUNE
- REQ-REPAIR-02: RETRY MUST attempt with a concrete adjustment
- REQ-REPAIR-03: DECOMPOSE MUST break task into smaller verifiable sub-steps
- REQ-REPAIR-04: PRUNE MUST remove unachievable tasks and escalate to user
- REQ-REPAIR-05: System MUST respect repair budget (default: 2 attempts per task)
- REQ-REPAIR-06: System MUST be configurable via `workflow.node_repair_budget` and `workflow.node_repair`

---

### 19. Health Validation

**Command:** `/gsdt:health [--repair]`

**Purpose:** Validate `.gsdt-planning/` directory integrity and auto-repair issues.

**Requirements:**
- REQ-HEALTH-01: System MUST check for missing required files
- REQ-HEALTH-02: System MUST validate configuration consistency
- REQ-HEALTH-03: System MUST detect orphaned plans without summaries
- REQ-HEALTH-04: System MUST check phase numbering and roadmap sync
- REQ-HEALTH-05: `--repair` flag MUST auto-fix recoverable issues

---

### 20. Cross-Phase Regression Gate

**Purpose:** Prevent regressions from compounding across phases by running prior phases' test suites after execution.

**Requirements:**
- REQ-REGR-01: System MUST run test suites from all completed prior phases after phase execution
- REQ-REGR-02: System MUST report any test failures as cross-phase regressions
- REQ-REGR-03: Regressions MUST be surfaced before post-execution verification
- REQ-REGR-04: System MUST identify which prior phase's tests were broken

**When:** Runs automatically during `/gsdt:execute-phase` before the verifier step.

---

### 21. Requirements Coverage Gate

**Purpose:** Ensure all phase requirements are covered by at least one plan before planning completes.

**Requirements:**
- REQ-COVGATE-01: System MUST extract all requirement IDs assigned to the phase from ROADMAP.md
- REQ-COVGATE-02: System MUST verify each requirement appears in at least one PLAN.md
- REQ-COVGATE-03: Uncovered requirements MUST block planning completion
- REQ-COVGATE-04: System MUST report which specific requirements lack plan coverage

**When:** Runs automatically at the end of `/gsdt:plan-phase` after the plan checker loop.

---

## Context Engineering Features

### 22. Context Window Monitoring

**Purpose:** Prevent context rot by alerting both user and agent when context is running low.

**Requirements:**
- REQ-CTX-01: Statusline MUST display context usage percentage to user
- REQ-CTX-02: Context monitor MUST inject agent-facing warnings at ≤35% remaining (WARNING)
- REQ-CTX-03: Context monitor MUST inject agent-facing warnings at ≤25% remaining (CRITICAL)
- REQ-CTX-04: Warnings MUST debounce (5 tool uses between repeated warnings)
- REQ-CTX-05: Severity escalation (WARNING→CRITICAL) MUST bypass debounce
- REQ-CTX-06: Context monitor MUST differentiate GSDT-active vs non-GSDT-active projects
- REQ-CTX-07: Warnings MUST be advisory, never imperative commands that override user preferences
- REQ-CTX-08: All hooks MUST fail silently and never block tool execution

**Architecture:** Two-part bridge system:
1. Statusline writes metrics to `/tmp/claude-ctx-{session}.json`
2. Context monitor reads metrics and injects `additionalContext` warnings

---

### 23. Session Management

**Commands:** `/gsdt:pause-work`, `/gsdt:resume-work`, `/gsdt:progress`

**Purpose:** Maintain project continuity across context resets and sessions.

**Requirements:**
- REQ-SESSION-01: Pause MUST save current position and next steps to `continue-here.md` and structured `HANDOFF.json`
- REQ-SESSION-02: Resume MUST restore full project context from HANDOFF.json (preferred) or state files (fallback)
- REQ-SESSION-03: Progress MUST show current position, next action, and overall completion
- REQ-SESSION-04: Progress MUST read all state files (STATE.md, ROADMAP.md, phase directories)
- REQ-SESSION-05: All session operations MUST work after `/clear` (context reset)
- REQ-SESSION-06: HANDOFF.json MUST include blockers, human actions pending, and in-progress task state
- REQ-SESSION-07: Resume MUST surface human actions and blockers immediately on session start

---

### 24. Session Reporting

**Command:** `/gsdt:session-report`

**Purpose:** Generate a structured post-session summary document capturing work performed, outcomes achieved, and estimated resource usage.

**Requirements:**
- REQ-REPORT-01: System MUST gather data from STATE.md, git log, and plan/summary files
- REQ-REPORT-02: System MUST include commits made, plans executed, and phases progressed
- REQ-REPORT-03: System MUST estimate token usage and cost based on session activity
- REQ-REPORT-04: System MUST include active blockers and decisions made
- REQ-REPORT-05: System MUST recommend next steps

**Produces:** `.gsdt-planning/reports/SESSION_REPORT.md`

**Report Sections:**
- Session overview (duration, milestone, phase)
- Work performed (commits, plans, phases)
- Outcomes and deliverables
- Blockers and decisions
- Resource estimates (tokens, cost)
- Next steps recommendation

---

### 25. Multi-Agent Orchestration

**Purpose:** Coordinate specialized agents with fresh context windows for each task.

**Requirements:**
- REQ-ORCH-01: Each agent MUST receive a fresh context window
- REQ-ORCH-02: Orchestrators MUST be thin — spawn agents, collect results, route next
- REQ-ORCH-03: Context payload MUST include all relevant project artifacts
- REQ-ORCH-04: Parallel agents MUST be truly independent (no shared mutable state)
- REQ-ORCH-05: Agent results MUST be written to disk before orchestrator processes them
- REQ-ORCH-06: Failed agents MUST be detected (spot-check actual output vs reported failure)

---

### 26. Model Profiles

**Command:** `/gsdt:set-profile <quality|balanced|budget|inherit>`

**Purpose:** Control which AI model each agent uses, balancing quality vs cost.

**Requirements:**
- REQ-MODEL-01: System MUST support 4 profiles: `quality`, `balanced`, `budget`, `inherit`
- REQ-MODEL-02: Each profile MUST define model tier per agent (see profile table)
- REQ-MODEL-03: Per-agent overrides MUST take precedence over profile
- REQ-MODEL-04: `inherit` profile MUST defer to runtime's current model selection
- REQ-MODEL-04a: `inherit` profile MUST be used when running non-Anthropic providers (OpenRouter, local models) to avoid unexpected API costs
- REQ-MODEL-05: Profile switch MUST be programmatic (script, not LLM-driven)
- REQ-MODEL-06: Model resolution MUST happen once per orchestration, not per spawn

**Profile Assignments:**

| Agent | `quality` | `balanced` | `budget` | `inherit` |
|-------|-----------|------------|----------|-----------|
| gsdt-planner | Opus | Opus | Sonnet | Inherit |
| gsdt-roadmapper | Opus | Sonnet | Sonnet | Inherit |
| gsdt-executor | Opus | Sonnet | Sonnet | Inherit |
| gsdt-phase-researcher | Opus | Sonnet | Haiku | Inherit |
| gsdt-project-researcher | Opus | Sonnet | Haiku | Inherit |
| gsdt-research-synthesizer | Sonnet | Sonnet | Haiku | Inherit |
| gsdt-debugger | Opus | Sonnet | Sonnet | Inherit |
| gsdt-codebase-mapper | Sonnet | Haiku | Haiku | Inherit |
| gsdt-verifier | Sonnet | Sonnet | Haiku | Inherit |
| gsdt-plan-checker | Sonnet | Sonnet | Haiku | Inherit |
| gsdt-integration-checker | Sonnet | Sonnet | Haiku | Inherit |
| gsdt-nyquist-auditor | Sonnet | Sonnet | Haiku | Inherit |

---

## Brownfield Features

### 27. Codebase Mapping

**Command:** `/gsdt:map-codebase [area]`

**Purpose:** Analyze an existing codebase before starting a new project, so GSDT understands what exists.

**Requirements:**
- REQ-MAP-01: System MUST spawn parallel mapper agents for each analysis area
- REQ-MAP-02: System MUST produce structured documents in `.gsdt-planning/codebase/`
- REQ-MAP-03: System MUST detect: tech stack, architecture patterns, coding conventions, concerns
- REQ-MAP-04: Subsequent `/gsdt:new-project` MUST load codebase mapping and focus questions on what's being added
- REQ-MAP-05: Optional `[area]` argument MUST scope mapping to a specific area

**Produces:**
| Document | Content |
|----------|---------|
| `STACK.md` | Languages, frameworks, databases, infrastructure |
| `ARCHITECTURE.md` | Patterns, layers, data flow, boundaries |
| `CONVENTIONS.md` | Naming, file organization, code style, testing patterns |
| `CONCERNS.md` | Technical debt, security issues, performance bottlenecks |
| `STRUCTURE.md` | Directory layout and file organization |
| `TESTING.md` | Test infrastructure, coverage, patterns |
| `INTEGRATIONS.md` | External services, APIs, third-party dependencies |

---

## Utility Features

### 28. Debug System

**Command:** `/gsdt:debug [description]`

**Purpose:** Systematic debugging with persistent state across context resets.

**Requirements:**
- REQ-DEBUG-01: System MUST create debug session file in `.gsdt-planning/debug/`
- REQ-DEBUG-02: System MUST track hypotheses, evidence, and eliminated theories
- REQ-DEBUG-03: System MUST persist state so debugging survives context resets
- REQ-DEBUG-04: System MUST require human verification before marking resolved
- REQ-DEBUG-05: Resolved sessions MUST append to `.gsdt-planning/debug/knowledge-base.md`
- REQ-DEBUG-06: Knowledge base MUST be consulted on new debug sessions to prevent re-investigation

**Debug Session States:** `gathering` → `investigating` → `fixing` → `verifying` → `awaiting_human_verify` → `resolved`

---

### 29. Todo Management

**Commands:** `/gsdt:add-todo [desc]`, `/gsdt:check-todos`

**Purpose:** Capture ideas and tasks during sessions for later work.

**Requirements:**
- REQ-TODO-01: System MUST capture todo from current conversation context
- REQ-TODO-02: Todos MUST be stored in `.gsdt-planning/todos/pending/`
- REQ-TODO-03: Completed todos MUST move to `.gsdt-planning/todos/done/`
- REQ-TODO-04: Check-todos MUST list all pending items with selection to work on one

---

### 30. Statistics Dashboard

**Command:** `/gsdt:stats`

**Purpose:** Display project metrics — phases, plans, requirements, git history, and timeline.

**Requirements:**
- REQ-STATS-01: System MUST show phase/plan completion counts
- REQ-STATS-02: System MUST show requirement coverage
- REQ-STATS-03: System MUST show git commit metrics
- REQ-STATS-04: System MUST support multiple output formats (json, table, bar)

---

### 31. Update System

**Command:** `/gsdt:update`

**Purpose:** Update GSDT to the latest version with changelog preview.

**Requirements:**
- REQ-UPDATE-01: System MUST check for new versions via npm
- REQ-UPDATE-02: System MUST display changelog for new version before updating
- REQ-UPDATE-03: System MUST be runtime-aware and target the correct directory
- REQ-UPDATE-04: System MUST back up locally modified files to `gsdt-local-patches/`
- REQ-UPDATE-05: `/gsdt:reapply-patches` MUST restore local modifications after update

---

### 32. Settings Management

**Command:** `/gsdt:settings`

**Purpose:** Interactive configuration of core strategy defaults, workflow toggles, discuss mode, and model profile.

**Requirements:**
- REQ-SETTINGS-01: System MUST present current settings with toggle options
- REQ-SETTINGS-02: System MUST update `.gsdt-planning/config.json`
- REQ-SETTINGS-03: System MUST support saving as global defaults (`~/.gsd/defaults.json`)

**Configurable Settings:**
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mode` | enum | `yolo` | `interactive` or `yolo` (auto-approve) |
| `granularity` | enum | `fine` | `coarse`, `standard`, or `fine` |
| `model_profile` | enum | `quality` | `quality`, `balanced`, `budget`, or `inherit` |
| `workflow.research` | boolean | `true` | Domain research before planning |
| `workflow.plan_check` | boolean | `true` | Plan verification loop |
| `workflow.verifier` | boolean | `true` | Post-execution verification |
| `workflow.auto_advance` | boolean | `false` | Auto-chain discuss→plan→execute |
| `workflow.nyquist_validation` | boolean | `true` | Nyquist test coverage mapping |
| `workflow.ui_phase` | boolean | `true` | UI design contract generation |
| `workflow.ui_safety_gate` | boolean | `true` | Prompt for ui-phase on frontend phases |
| `workflow.research_before_questions` | boolean | `false` | Run best-practice research before question rounds |
| `workflow.discuss_mode` | enum | `discuss` | Open-ended discussion vs. codebase-first assumptions mode |
| `workflow.skip_discuss` | boolean | `false` | Skip discuss-phase in autonomous mode |
| `hooks.context_warnings` | boolean | `true` | Warn before the context window gets too full |
| `planning.commit_docs` | boolean | `true` | Commit `.gsdt-planning/` files to git |
| `parallelization.enabled` | boolean | `true` | Run independent plans simultaneously |
| `git.branching_strategy` | enum | `none` | `none`, `phase`, or `milestone` |

> **Current onboarding behavior:** `/gsdt:new-project` now seeds `granularity = fine`, `parallelization.enabled = true`, and `planning.commit_docs = true` without prompting, so initialization questions stay focused on product and workflow choices.

> **Advanced config stays in `config.json` / `config-set`:** `workflow.text_mode`, `workflow.node_repair`, `workflow.node_repair_budget`, `planning.search_gitignored`, `hooks.workflow_guard`, and `git.quick_branch_template` are still configurable, but they are not surfaced in the current `/gsdt:settings` questionnaire.

---

### 33. Test Generation

**Command:** `/gsdt:add-tests [N]`

**Purpose:** Generate tests for a completed phase based on UAT criteria and implementation.

**Requirements:**
- REQ-TEST-01: System MUST analyze completed phase implementation
- REQ-TEST-02: System MUST generate tests based on UAT criteria and acceptance criteria
- REQ-TEST-03: System MUST use existing test infrastructure patterns

---

## Infrastructure Features

### 34. Git Integration

**Purpose:** Atomic commits, branching strategies, and clean history management.

**Requirements:**
- REQ-GIT-01: Each task MUST get its own atomic commit
- REQ-GIT-02: Commit messages MUST follow structured format: `type(scope): description`
- REQ-GIT-03: System MUST support 3 branching strategies: `none`, `phase`, `milestone`
- REQ-GIT-04: Phase strategy MUST create one branch per phase
- REQ-GIT-05: Milestone strategy MUST create one branch per milestone
- REQ-GIT-06: Complete-milestone MUST offer squash merge (recommended) or merge with history
- REQ-GIT-07: System MUST respect `commit_docs` setting for `.gsdt-planning/` files
- REQ-GIT-08: System MUST auto-detect `.gsdt-planning/` in `.gitignore` and skip commits

**Commit Format:**
```
type(phase-plan): description

# Examples:
docs(08-02): complete user registration plan
feat(08-02): add email confirmation flow
fix(03-01): correct auth token expiry
```

---

### 35. CLI Tools

**Purpose:** Programmatic utilities for workflows and agents, replacing repetitive inline bash patterns.

**Requirements:**
- REQ-CLI-01: System MUST provide atomic commands for state, config, phase, roadmap operations
- REQ-CLI-02: System MUST provide compound `init` commands that load all context for each workflow
- REQ-CLI-03: System MUST support `--raw` flag for machine-readable output
- REQ-CLI-04: System MUST support `--cwd` flag for sandboxed subagent operation
- REQ-CLI-05: All operations MUST use forward-slash paths on Windows

**Command Categories:** State (11 subcommands), Phase (5), Roadmap (3), Verify (8), Template (2), Frontmatter (4), Scaffold (4), Init (12), Validate (2), Progress, Stats, Todo

---

### 36. Multi-Runtime Support

**Purpose:** Run GSDT across 6 different AI coding agent runtimes.

**Requirements:**
- REQ-RUNTIME-01: System MUST support Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Antigravity
- REQ-RUNTIME-02: Installer MUST transform content per runtime (tool names, paths, frontmatter)
- REQ-RUNTIME-03: Installer MUST support interactive and non-interactive (`--claude --global`) modes
- REQ-RUNTIME-04: Installer MUST support both global and local installation
- REQ-RUNTIME-05: Uninstall MUST cleanly remove all GSDT files without affecting other configurations
- REQ-RUNTIME-06: Installer MUST handle platform differences (Windows, macOS, Linux, WSL, Docker)

**Runtime Transformations:**

| Aspect | Claude Code | OpenCode | Gemini | Codex | Copilot | Antigravity |
|--------|------------|----------|--------|-------|---------|-------------|
| Commands | Slash commands | Slash commands | Slash commands | Skills (TOML) | Slash commands | Skills |
| Agent format | Claude native | `mode: subagent` | Claude native | Skills | Tool mapping | Skills |
| Hook events | `PostToolUse` | N/A | `AfterTool` | N/A | N/A | N/A |
| Config | `settings.json` | `opencode.json(c)` | `settings.json` | TOML | Instructions | Config |

---

### 37. Hook System

**Purpose:** Runtime event hooks for context monitoring, status display, and update checking.

**Requirements:**
- REQ-HOOK-01: Statusline MUST display model, current task, directory, and context usage
- REQ-HOOK-02: Context monitor MUST inject agent-facing warnings at threshold levels
- REQ-HOOK-03: Update checker MUST run in background on session start
- REQ-HOOK-04: All hooks MUST respect `CLAUDE_CONFIG_DIR` env var
- REQ-HOOK-05: All hooks MUST include 3-second stdin timeout guard
- REQ-HOOK-06: All hooks MUST fail silently on any error
- REQ-HOOK-07: Context usage MUST normalize for autocompact buffer (16.5% reserved)

**Statusline Display:**
```
[⬆ /gsdt:update │] model │ [current task │] directory [█████░░░░░ 50%]
```

Color coding: <50% green, <65% yellow, <80% orange, ≥80% red with skull emoji

### 38. Developer Profiling

**Command:** `/gsdt:profile-user [--questionnaire] [--refresh]`

**Purpose:** Analyze Claude Code session history to build behavioral profiles across 8 dimensions, generating artifacts that personalize Claude's responses to the developer's style.

**Dimensions:**
1. Communication style (terse vs verbose, formal vs casual)
2. Decision patterns (rapid vs deliberate, risk tolerance)
3. Debugging approach (systematic vs intuitive, log preference)
4. UX preferences (design sensibility, accessibility awareness)
5. Vendor/technology choices (framework preferences, ecosystem familiarity)
6. Frustration triggers (what causes friction in workflows)
7. Learning style (documentation vs examples, depth preference)
8. Explanation depth (high-level vs implementation detail)

**Generated Artifacts:**
- `USER-PROFILE.md` — Full behavioral profile with evidence citations
- `/gsdt:dev-preferences` command — Load preferences in any session
- `CLAUDE.md` profile section — Auto-discovered by Claude Code

**Flags:**
- `--questionnaire` — Interactive questionnaire fallback when session history is unavailable
- `--refresh` — Re-analyze sessions and regenerate profile

**Pipeline Modules:**
- `profile-pipeline.cjs` — Session scanning, message extraction, sampling
- `profile-output.cjs` — Profile rendering, questionnaire, artifact generation
- `gsdt-user-profiler` agent — Behavioral analysis from session data

**Requirements:**
- REQ-PROF-01: Session analysis MUST cover at least 8 behavioral dimensions
- REQ-PROF-02: Profile MUST cite evidence from actual session messages
- REQ-PROF-03: Questionnaire MUST be available as fallback when no session history exists
- REQ-PROF-04: Generated artifacts MUST be discoverable by Claude Code (CLAUDE.md integration)

### 39. Execution Hardening

**Purpose:** Three additive quality improvements to the execution pipeline that catch cross-plan failures before they cascade.

**Components:**

**1. Pre-Wave Dependency Check** (execute-phase)
Before spawning wave N+1, verify key-links from prior wave artifacts exist and are wired correctly. Catches cross-plan dependency gaps before they cascade into downstream failures.

**2. Cross-Plan Data Contracts — Dimension 9** (plan-checker)
New analysis dimension that checks plans sharing data pipelines have compatible transformations. Flags when one plan strips data that another plan needs in its original form.

**3. Export-Level Spot Check** (verify-phase)
After Level 3 wiring verification passes, spot-check individual exports for actual usage. Catches dead stores that exist in wired files but are never called.

**Requirements:**
- REQ-HARD-01: Pre-wave check MUST verify key-links from all prior wave artifacts before spawning next wave
- REQ-HARD-02: Cross-plan contract check MUST detect incompatible data transformations between plans
- REQ-HARD-03: Export spot-check MUST identify dead stores in wired files

---

### 40. Verification Debt Tracking

**Command:** `/gsdt:audit-uat`

**Purpose:** Prevent silent loss of UAT/verification items when projects advance past phases with outstanding tests. Surfaces verification debt across all prior phases so items are never forgotten.

**Components:**

**1. Cross-Phase Health Check** (progress.md Step 1.6)
Every `/gsdt:progress` call scans ALL phases in the current milestone for outstanding items (pending, skipped, blocked, human_needed). Displays a non-blocking warning section with actionable links.

**2. `status: partial`** (verify-work.md, UAT.md)
New UAT status that distinguishes between "session ended" and "all tests resolved". Prevents `status: complete` when tests are still pending, blocked, or skipped without reason.

**3. `result: blocked` with `blocked_by` tag** (verify-work.md, UAT.md)
New test result type for tests blocked by external dependencies (server, physical device, release build, third-party services). Categorized separately from skipped tests.

**4. HUMAN-UAT.md Persistence** (execute-phase.md)
When verification returns `human_needed`, items are persisted as a trackable HUMAN-UAT.md file with `status: partial`. Feeds into the cross-phase health check and audit systems.

**5. Phase Completion Warnings** (phase.cjs, transition.md)
`phase complete` CLI returns verification debt warnings in its JSON output. Transition workflow surfaces outstanding items before confirmation.

**Requirements:**
- REQ-DEBT-01: System MUST surface outstanding UAT/verification items from ALL prior phases in `/gsdt:progress`
- REQ-DEBT-02: System MUST distinguish incomplete testing (partial) from completed testing (complete)
- REQ-DEBT-03: System MUST categorize blocked tests with `blocked_by` tags
- REQ-DEBT-04: System MUST persist human_needed verification items as trackable UAT files
- REQ-DEBT-05: System MUST warn (non-blocking) during phase completion and transition when verification debt exists
- REQ-DEBT-06: `/gsdt:audit-uat` MUST scan all phases, categorize items by testability, and produce a human test plan

---

## v1.27 Features

### 41. Fast Mode

**Command:** `/gsdt:fast [task description]`

**Purpose:** Execute trivial tasks inline without spawning subagents or generating PLAN.md files. For tasks too small to justify planning overhead: typo fixes, config changes, small refactors, forgotten commits, simple additions.

**Requirements:**
- REQ-FAST-01: System MUST execute the task directly in the current context without subagents
- REQ-FAST-02: System MUST produce an atomic git commit for the change
- REQ-FAST-03: System MUST track the task in `.gsdt-planning/quick/` for state consistency
- REQ-FAST-04: System MUST NOT be used for tasks requiring research, multi-step planning, or verification

**When to use vs `/gsdt:quick`:**
- `/gsdt:fast` — One-sentence tasks executable in under 2 minutes (typo, config change, small addition)
- `/gsdt:quick` — Anything needing research, multi-step planning, or verification

---

### 42. Cross-AI Peer Review

**Command:** `/gsdt:review --phase N [--gemini] [--claude] [--codex] [--all]`

**Purpose:** Invoke external AI CLIs (Gemini, Claude, Codex) to independently review phase plans. Produces structured REVIEWS.md with per-reviewer feedback.

**Requirements:**
- REQ-REVIEW-01: System MUST detect available AI CLIs on the system
- REQ-REVIEW-02: System MUST build a structured review prompt from phase plans
- REQ-REVIEW-03: System MUST invoke each selected CLI independently
- REQ-REVIEW-04: System MUST collect responses and produce `REVIEWS.md`
- REQ-REVIEW-05: Reviews MUST be consumable by `/gsdt:plan-phase --reviews`

**Produces:** `{phase}-REVIEWS.md` — Per-reviewer structured feedback

---

### 43. Backlog Parking Lot

**Commands:** `/gsdt:add-backlog <description>`, `/gsdt:review-backlog`, `/gsdt:plant-seed <idea>`

**Purpose:** Capture ideas that aren't ready for active planning. Backlog items use 999.x numbering to stay outside the active phase sequence. Seeds are forward-looking ideas with trigger conditions that surface automatically at the right milestone.

**Requirements:**
- REQ-BACKLOG-01: Backlog items MUST use 999.x numbering to stay outside active phase sequence
- REQ-BACKLOG-02: Phase directories MUST be created immediately so `/gsdt:discuss-phase` and `/gsdt:plan-phase` work on them
- REQ-BACKLOG-03: `/gsdt:review-backlog` MUST support promote, keep, and remove actions per item
- REQ-BACKLOG-04: Promoted items MUST be renumbered into the active milestone sequence
- REQ-SEED-01: Seeds MUST capture the full WHY and WHEN to surface conditions
- REQ-SEED-02: `/gsdt:new-milestone` MUST scan seeds and present matches

**Produces:**
| Artifact | Description |
|----------|-------------|
| `.gsdt-planning/phases/999.x-slug/` | Backlog item directory |
| `.gsdt-planning/seeds/SEED-NNN-slug.md` | Seed with trigger conditions |

---

### 44. Persistent Context Threads

**Command:** `/gsdt:thread [name | description]`

**Purpose:** Lightweight cross-session knowledge stores for work that spans multiple sessions but doesn't belong to any specific phase. Lighter weight than `/gsdt:pause-work` — no phase state, no plan context.

**Requirements:**
- REQ-THREAD-01: System MUST support create, list, and resume modes
- REQ-THREAD-02: Threads MUST be stored in `.gsdt-planning/threads/` as markdown files
- REQ-THREAD-03: Thread files MUST include Goal, Context, References, and Next Steps sections
- REQ-THREAD-04: Resuming a thread MUST load its full context into the current session
- REQ-THREAD-05: Threads MUST be promotable to phases or backlog items

**Produces:** `.gsdt-planning/threads/{slug}.md` — Persistent context thread

---

### 45. PR Branch Filtering

**Command:** `/gsdt:pr-branch [target branch]`

**Purpose:** Create a clean branch suitable for pull requests by filtering out `.gsdt-planning/` commits. Reviewers see only code changes, not GSDT planning artifacts.

**Requirements:**
- REQ-PRBRANCH-01: System MUST identify commits that only modify `.gsdt-planning/` files
- REQ-PRBRANCH-02: System MUST create a new branch with planning commits filtered out
- REQ-PRBRANCH-03: Code changes MUST be preserved exactly as committed

---

### 46. Security Hardening

**Purpose:** Defense-in-depth security for GSDT's planning artifacts. Because GSDT generates markdown files that become LLM system prompts, user-controlled text flowing into these files is a potential indirect prompt injection vector.

**Components:**

**1. Centralized Security Module** (`security.cjs`)
- Path traversal prevention — validates file paths resolve within the project directory
- Prompt injection detection — scans for known injection patterns in user-supplied text
- Safe JSON parsing — catches malformed input before state corruption
- Field name validation — prevents injection through config field names
- Shell argument validation — sanitizes user text before shell interpolation

**2. Prompt Injection Guard Hook** (`gsdt-prompt-guard.js`)
PreToolUse hook that scans Write/Edit calls targeting `.gsdt-planning/` for injection patterns. Advisory-only — logs detection for awareness without blocking legitimate operations.

**3. Workflow Guard Hook** (`gsdt-workflow-guard.js`)
PreToolUse hook that detects when Claude attempts file edits outside a GSDT workflow context. Advises using `/gsdt:quick` or `/gsdt:fast` instead of direct edits. Configurable via `hooks.workflow_guard` (default: false).

**4. CI-Ready Injection Scanner** (`prompt-injection-scan.test.cjs`)
Test suite that scans all agent, workflow, and command files for embedded injection vectors.

**Requirements:**
- REQ-SEC-01: All user-supplied file paths MUST be validated against the project directory
- REQ-SEC-02: Prompt injection patterns MUST be detected before text enters planning artifacts
- REQ-SEC-03: Security hooks MUST be advisory-only (never block legitimate operations)
- REQ-SEC-04: JSON parsing of user input MUST catch malformed data gracefully
- REQ-SEC-05: macOS `/var` → `/private/var` symlink resolution MUST be handled in path validation

---

### 47. Multi-Repo Workspace Support

**Purpose:** Auto-detection and project root resolution for monorepos and multi-repo setups. Supports workspaces where `.gsdt-planning/` may need to resolve across repository boundaries.

**Requirements:**
- REQ-MULTIREPO-01: System MUST auto-detect multi-repo workspace configuration
- REQ-MULTIREPO-02: System MUST resolve project root across repository boundaries
- REQ-MULTIREPO-03: Executor MUST record per-repo commit hashes in multi-repo mode

---

### 48. Discussion Audit Trail

**Purpose:** Auto-generate `DISCUSSION-LOG.md` during `/gsdt:discuss-phase` for full audit trail of decisions made during discussion.

**Requirements:**
- REQ-DISCLOG-01: System MUST auto-generate DISCUSSION-LOG.md during discuss-phase
- REQ-DISCLOG-02: Log MUST capture questions asked, options presented, and decisions made
- REQ-DISCLOG-03: Decision IDs MUST enable traceability from discuss-phase to plan-phase

---

## v1.28 Features

### 49. Forensics

**Command:** `/gsdt:forensics [description]`

**Purpose:** Post-mortem investigation of failed or stuck GSDT workflows.

**Requirements:**
- REQ-FORENSICS-01: System MUST analyze git history for anomalies (stuck loops, long gaps, repeated commits)
- REQ-FORENSICS-02: System MUST check artifact integrity (completed phases have expected files)
- REQ-FORENSICS-03: System MUST generate a markdown report saved to `.gsdt-planning/forensics/`
- REQ-FORENSICS-04: System MUST offer to create a GitHub issue with findings
- REQ-FORENSICS-05: System MUST NOT modify project files (read-only investigation)

**Produces:**
| Artifact | Description |
|----------|-------------|
| `.gsdt-planning/forensics/report-{timestamp}.md` | Post-mortem investigation report |

**Process:**
1. **Scan** — Analyze git history for anomalies: stuck loops, long gaps between commits, repeated identical commits
2. **Integrity Check** — Verify completed phases have expected artifact files
3. **Report** — Generate markdown report with findings, saved to `.gsdt-planning/forensics/`
4. **Issue** — Offer to create a GitHub issue with findings for team visibility

---

### 50. Milestone Summary

**Command:** `/gsdt:milestone-summary [version]`

**Purpose:** Generate comprehensive project summary from milestone artifacts for team onboarding.

**Requirements:**
- REQ-SUMMARY-01: System MUST aggregate phase plans, summaries, and verification results
- REQ-SUMMARY-02: System MUST work for both current and archived milestones
- REQ-SUMMARY-03: System MUST produce a single navigable document

**Produces:**
| Artifact | Description |
|----------|-------------|
| `MILESTONE-SUMMARY.md` | Comprehensive navigable summary of milestone artifacts |

**Process:**
1. **Collect** — Aggregate phase plans, summaries, and verification results from the target milestone
2. **Synthesize** — Combine artifacts into a single navigable document with cross-references
3. **Output** — Write `MILESTONE-SUMMARY.md` suitable for team onboarding and stakeholder review

---

### 51. Workstream Namespacing

**Command:** `/gsdt:workstreams`

**Purpose:** Parallel workstreams for concurrent work on different milestone areas.

**Requirements:**
- REQ-WS-01: System MUST isolate workstream state in separate `.gsdt-planning/workstreams/{name}/` directories
- REQ-WS-02: System MUST validate workstream names (alphanumeric + hyphens only, no path traversal)
- REQ-WS-03: System MUST support list, create, switch, status, progress, complete, resume subcommands

**Produces:**
| Artifact | Description |
|----------|-------------|
| `.gsdt-planning/workstreams/{name}/` | Isolated workstream directory structure |

**Process:**
1. **Create** — Initialize a named workstream with isolated `.gsdt-planning/workstreams/{name}/` directory
2. **Switch** — Change active workstream context for subsequent GSDT commands
3. **Manage** — List, check status, track progress, complete, or resume workstreams

---

### 52. Manager Dashboard

**Command:** `/gsdt:manager`

**Purpose:** Interactive command center for managing multiple phases from one terminal.

**Requirements:**
- REQ-MGR-01: System MUST show overview of all phases with status
- REQ-MGR-02: System MUST filter to current milestone scope
- REQ-MGR-03: System MUST show phase dependencies and conflicts

**Produces:** Interactive terminal output

**Process:**
1. **Scan** — Load all phases in the current milestone with their statuses
2. **Display** — Render overview showing phase dependencies, conflicts, and progress
3. **Interact** — Accept commands to navigate, inspect, or act on individual phases

---

### 53. Assumptions Discussion Mode

**Command:** `/gsdt:discuss-phase` with `workflow.discuss_mode: 'assumptions'`

**Purpose:** Replace interview-style questioning with codebase-first assumption analysis.

**Requirements:**
- REQ-ASSUME-01: System MUST analyze codebase to generate structured assumptions before asking questions
- REQ-ASSUME-02: System MUST classify assumptions by confidence level (Confident/Likely/Unclear)
- REQ-ASSUME-03: System MUST produce identical CONTEXT.md format as default discuss mode
- REQ-ASSUME-04: System MUST support confidence-based skip gate (all HIGH = no questions)

**Produces:**
| Artifact | Description |
|----------|-------------|
| `{phase}-CONTEXT.md` | Same format as default discuss mode |

**Process:**
1. **Analyze** — Scan codebase to generate structured assumptions about implementation approach
2. **Classify** — Categorize assumptions by confidence level: Confident, Likely, Unclear
3. **Gate** — If all assumptions are HIGH confidence, skip questioning entirely
4. **Confirm** — Present unclear assumptions as targeted questions to the user
5. **Output** — Produce `{phase}-CONTEXT.md` in identical format to default discuss mode

---

### 54. UI Phase Auto-Detection

**Part of:** `/gsdt:new-project` and `/gsdt:progress`

**Purpose:** Automatically detect UI-heavy projects and surface `/gsdt:ui-phase` recommendation.

**Requirements:**
- REQ-UI-DETECT-01: System MUST detect UI signals in project description (keywords, framework references)
- REQ-UI-DETECT-02: System MUST annotate ROADMAP.md phases with `ui_hint` when applicable
- REQ-UI-DETECT-03: System MUST suggest `/gsdt:ui-phase` in next steps for UI-heavy phases
- REQ-UI-DETECT-04: System MUST NOT make `/gsdt:ui-phase` mandatory

**Process:**
1. **Detect** — Scan project description and tech stack for UI signals (keywords, framework references)
2. **Annotate** — Add `ui_hint` markers to applicable phases in ROADMAP.md
3. **Surface** — Include `/gsdt:ui-phase` recommendation in next steps for UI-heavy phases

---

### 55. Multi-Runtime Installer Selection

**Part of:** `npx gsdt`

**Purpose:** Select multiple runtimes in a single interactive install session.

**Requirements:**
- REQ-MULTI-RT-01: Interactive prompt MUST support multi-select (e.g., Claude Code + Gemini)
- REQ-MULTI-RT-02: CLI flags MUST continue to work for non-interactive installs

**Process:**
1. **Detect** — Identify available AI CLI runtimes on the system
2. **Prompt** — Present multi-select interface for runtime selection
3. **Install** — Configure GSDT for all selected runtimes in a single session
