# GSDT CLI Tools Reference

> Programmatic API reference for `gsdt-tools.cjs`. Used by workflows and agents internally. For user-facing commands, see [Command Reference](COMMANDS.md).

---

## Overview

`gsdt-tools.cjs` is a Node.js CLI utility that replaces repetitive inline bash patterns across GSDT command, workflow, and agent files. It centralizes config parsing, model resolution, phase lookup, git commits, summary verification, state management, workstreams, capture/intake I/O, review pipelines, and template operations.

**Location:** `gsdt/bin/gsdt-tools.cjs`
**Modules:** 19 domain modules in `gsdt/bin/lib/`

**Usage:**
```bash
node gsdt-tools.cjs <command> [args] [--raw] [--cwd <path>] [--ws <name>]
```

**Global Flags:**
| Flag | Description |
|------|-------------|
| `--raw` | Machine-readable output (JSON or plain text, no formatting) |
| `--cwd <path>` | Override working directory (for sandboxed subagents) |
| `--ws <name>` | Override active workstream for commands that resolve planning paths |

---

## State Commands

Manage `.gsdt-planning/STATE.md` — the project's living memory.

```bash
# Load full project config + state as JSON
node gsdt-tools.cjs state load

# Output STATE.md frontmatter as JSON
node gsdt-tools.cjs state json

# Update a single field
node gsdt-tools.cjs state update <field> <value>

# Get STATE.md content or a specific section
node gsdt-tools.cjs state get [section]

# Batch update multiple fields
node gsdt-tools.cjs state patch --field1 val1 --field2 val2

# Increment plan counter
node gsdt-tools.cjs state advance-plan

# Record execution metrics
node gsdt-tools.cjs state record-metric --phase N --plan M --duration Xmin [--tasks N] [--files N]

# Recalculate progress bar
node gsdt-tools.cjs state update-progress

# Add a decision
node gsdt-tools.cjs state add-decision --summary "..." [--phase N] [--rationale "..."]
# Or from files:
node gsdt-tools.cjs state add-decision --summary-file path [--rationale-file path]

# Add/resolve blockers
node gsdt-tools.cjs state add-blocker --text "..."
node gsdt-tools.cjs state resolve-blocker --text "..."

# Record session continuity
node gsdt-tools.cjs state record-session --stopped-at "..." [--resume-file path]
```

### State Snapshot

Structured parse of the full STATE.md:

```bash
node gsdt-tools.cjs state-snapshot
```

Returns JSON with: current position, phase, plan, status, decisions, blockers, metrics, last activity.

---

## Phase Commands

Manage phases — directories, numbering, and roadmap sync.

```bash
# Find phase directory by number
node gsdt-tools.cjs find-phase <phase>

# Calculate next decimal phase number for insertions
node gsdt-tools.cjs phase next-decimal <phase>

# Append new phase to roadmap + create directory
node gsdt-tools.cjs phase add <description>

# Insert decimal phase after existing
node gsdt-tools.cjs phase insert <after> <description>

# Remove phase, renumber subsequent
node gsdt-tools.cjs phase remove <phase> [--force]

# Mark phase complete, update state + roadmap
node gsdt-tools.cjs phase complete <phase>

# Index plans with waves and status
node gsdt-tools.cjs phase-plan-index <phase>

# List phases with filtering
node gsdt-tools.cjs phases list [--type planned|executed|all] [--phase N] [--include-archived]
```

---

## Roadmap Commands

Parse and update `ROADMAP.md`.

```bash
# Extract phase section from ROADMAP.md
node gsdt-tools.cjs roadmap get-phase <phase>

# Full roadmap parse with disk status
node gsdt-tools.cjs roadmap analyze

# Update progress table row from disk
node gsdt-tools.cjs roadmap update-plan-progress <N>
```

---

## Config Commands

Read and write `.gsdt-planning/config.json`.

```bash
# Initialize config.json with defaults
node gsdt-tools.cjs config-ensure-section

# Set a config value (dot notation)
node gsdt-tools.cjs config-set <key> <value>

# Get a config value
node gsdt-tools.cjs config-get <key>

# Set model profile
node gsdt-tools.cjs config-set-model-profile <profile>
```

---

## Model Resolution

```bash
# Get model for agent based on current profile
node gsdt-tools.cjs resolve-model <agent-name>
# Returns: opus | sonnet | haiku | inherit
```

Agent names: `gsdt-planner`, `gsdt-executor`, `gsdt-phase-researcher`, `gsdt-project-researcher`, `gsdt-research-synthesizer`, `gsdt-verifier`, `gsdt-plan-checker`, `gsdt-integration-checker`, `gsdt-roadmapper`, `gsdt-debugger`, `gsdt-codebase-mapper`, `gsdt-nyquist-auditor`

---

## Verification Commands

Validate plans, phases, references, and commits.

```bash
# Verify SUMMARY.md file
node gsdt-tools.cjs verify-summary <path> [--check-count N]

# Check PLAN.md structure + tasks
node gsdt-tools.cjs verify plan-structure <file>

# Check all plans have summaries
node gsdt-tools.cjs verify phase-completeness <phase>

# Check @-refs + paths resolve
node gsdt-tools.cjs verify references <file>

# Batch verify commit hashes
node gsdt-tools.cjs verify commits <hash1> [hash2] ...

# Check must_haves.artifacts
node gsdt-tools.cjs verify artifacts <plan-file>

# Check must_haves.key_links
node gsdt-tools.cjs verify key-links <plan-file>
```

---

## Validation Commands

Check project integrity.

```bash
# Check phase numbering, disk/roadmap sync
node gsdt-tools.cjs validate consistency

# Check .gsdt-planning/ integrity, optionally repair
node gsdt-tools.cjs validate health [--repair]
```

---

## Template Commands

Template selection and filling.

```bash
# Select summary template based on granularity
node gsdt-tools.cjs template select <type>

# Fill template with variables
node gsdt-tools.cjs template fill <type> --phase N [--plan M] [--name "..."] [--type execute|tdd] [--wave N] [--fields '{json}']
```

Template types for `fill`: `summary`, `plan`, `verification`

---

## Frontmatter Commands

YAML frontmatter CRUD operations on any Markdown file.

```bash
# Extract frontmatter as JSON
node gsdt-tools.cjs frontmatter get <file> [--field key]

# Update single field
node gsdt-tools.cjs frontmatter set <file> --field key --value jsonVal

# Merge JSON into frontmatter
node gsdt-tools.cjs frontmatter merge <file> --data '{json}'

# Validate required fields
node gsdt-tools.cjs frontmatter validate <file> --schema plan|summary|verification
```

---

## Scaffold Commands

Create pre-structured files and directories.

```bash
# Create CONTEXT.md template
node gsdt-tools.cjs scaffold context --phase N

# Create UAT.md template
node gsdt-tools.cjs scaffold uat --phase N

# Create VERIFICATION.md template
node gsdt-tools.cjs scaffold verification --phase N

# Create phase directory
node gsdt-tools.cjs scaffold phase-dir --phase N --name "phase name"
```

---

## Init Commands (Compound Context Loading)

Load all context needed for a specific workflow in one call. Returns JSON with project info, config, state, and workflow-specific data.

```bash
node gsdt-tools.cjs init execute-phase <phase>
node gsdt-tools.cjs init plan-phase <phase>
node gsdt-tools.cjs init new-project
node gsdt-tools.cjs init new-milestone
node gsdt-tools.cjs init quick <description>
node gsdt-tools.cjs init resume
node gsdt-tools.cjs init verify-work <phase>
node gsdt-tools.cjs init phase-op <phase>
node gsdt-tools.cjs init todos [area]
node gsdt-tools.cjs init milestone-op
node gsdt-tools.cjs init map-codebase
node gsdt-tools.cjs init progress
```

**Large payload handling:** When output exceeds ~50KB, the CLI writes to a temp file and returns `@file:/tmp/gsdt-init-XXXXX.json`. Workflows check for the `@file:` prefix and read from disk:

```bash
INIT=$(node gsdt-tools.cjs init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

---

## Milestone Commands

```bash
# Archive milestone
node gsdt-tools.cjs milestone complete <version> [--name <name>] [--archive-phases]

# Mark requirements as complete
node gsdt-tools.cjs requirements mark-complete <ids>
# Accepts: REQ-01,REQ-02 or REQ-01 REQ-02 or [REQ-01, REQ-02]
```

---

## Utility Commands

```bash
# Convert text to URL-safe slug
node gsdt-tools.cjs generate-slug "Some Text Here"
# → some-text-here

# Get timestamp
node gsdt-tools.cjs current-timestamp [full|date|filename]

# Count and list pending todos
node gsdt-tools.cjs list-todos [area]

# Check file/directory existence
node gsdt-tools.cjs verify-path-exists <path>

# Aggregate all SUMMARY.md data
node gsdt-tools.cjs history-digest

# Extract structured data from SUMMARY.md
node gsdt-tools.cjs summary-extract <path> [--fields field1,field2]

# Project statistics
node gsdt-tools.cjs stats [json|table]

# Progress rendering
node gsdt-tools.cjs progress [json|table|bar]

# Complete a todo
node gsdt-tools.cjs todo complete <filename>

# UAT audit — scan all phases for unresolved items
node gsdt-tools.cjs audit-uat

# Git commit with config checks
node gsdt-tools.cjs commit <message> [--files f1 f2] [--amend] [--no-verify]

# Web search (requires Brave API key)
node gsdt-tools.cjs websearch <query> [--limit N] [--freshness day|week|month]
```

> **`--no-verify`**: Skips pre-commit hooks. Used by parallel executor agents during wave-based execution to avoid build lock contention (e.g., cargo lock fights in Rust projects). The orchestrator runs hooks once after each wave completes. Do not use `--no-verify` during sequential execution — let hooks run normally.

---

## Agent Skill Injection

Resolve extra configured skills for a specific agent type.

```bash
node gsdt-tools.cjs agent-skills gsdt-executor
node gsdt-tools.cjs agent-skills gsdt-planner
```

Used by workflows that support `config.agent_skills` to prepend extra project-specific instructions without hardcoding them into agent files.

---

## Workstream Commands

Manage `.gsdt-planning/workstreams/{name}/` namespaces for parallel milestones.

```bash
# Create a workstream (migrates flat mode automatically unless disabled)
node gsdt-tools.cjs workstream create <name> [--migrate-name <existing>] [--no-migrate]

# List workstreams
node gsdt-tools.cjs workstream list

# Show one workstream
node gsdt-tools.cjs workstream status <name>

# Mark complete / archive
node gsdt-tools.cjs workstream complete <name>

# Set or get active workstream
node gsdt-tools.cjs workstream set <name>
node gsdt-tools.cjs workstream get

# Aggregate progress
node gsdt-tools.cjs workstream progress
```

---

## Capture Commands

Deterministic storage and routing support for `/gsdt:capture`.

```bash
# Save a raw capture fragment (text passed after the subcommand)
node gsdt-tools.cjs capture save "freeform text..."

# Read the current capture graph and trigger stats
node gsdt-tools.cjs capture graph

# Return the next deterministic routing decision
node gsdt-tools.cjs capture decide

# List saved fragments
node gsdt-tools.cjs capture fragments
```

---

## Intake Commands

Deterministic intake storage, ledger merges, readiness, and artifact materialization for `/gsdt:intake`.

```bash
# Load the full intake state
node gsdt-tools.cjs intake state

# Save raw intake text
node gsdt-tools.cjs intake save-raw "freeform text..."

# Merge semantic units into the ledger
node gsdt-tools.cjs intake merge [--resolution-file path] [--resolution-json json]

# Score readiness and routing
node gsdt-tools.cjs intake decide [--assessment-file path] [--assessment-json json]

# Render cards + brief content without writing phase artifacts
node gsdt-tools.cjs intake render

# Materialize cards/brief and optional phase intake artifact
node gsdt-tools.cjs intake materialize [--artifacts-file path] [--artifacts-json json]
```

---

## Review Commands

Unified review entrypoint for cross-AI reviews, UI audits, ship reviews, and Assess merging.

```bash
# Create/list/show review sessions
node gsdt-tools.cjs review create-session --type cross-ai --phase 03
node gsdt-tools.cjs review list
node gsdt-tools.cjs review get <session-id>

# Run review modes
node gsdt-tools.cjs review cross-ai --phase 03 [--json] [--threshold 0.6]
node gsdt-tools.cjs review ui-audit --phase 03 [--json]
node gsdt-tools.cjs review ship --pr 123 [--json]
node gsdt-tools.cjs review assess --phase 03 [--json] [--reviewer-output-file path]
```

Useful Assess flags:

- `--reviewer-output-file PATH`
- `--reviewer-output-json JSON`
- `--resolved-findings-file PATH`
- `--resolved-findings-json JSON`
- `--skip-compound`

---

## Compound Commands

Reusable learning-memory pipeline for bug fixes, reviewer findings, and solution docs.

```bash
# Find similar prior solutions
node gsdt-tools.cjs compound find "query text"

# Process researcher output into learnings
node gsdt-tools.cjs compound process --researcher-output '{"key":"value"}'

# Emit or dispatch a structured event
node gsdt-tools.cjs compound dispatch --event-file event.json
node gsdt-tools.cjs compound emit --event-json '{"source":"assess"}'

# Hook integration
node gsdt-tools.cjs compound hook --event post-commit --commit-hash <sha> --commit-msg "..."

# Write memory entries or anti-pattern notes directly
node gsdt-tools.cjs compound memory --research '{"summary":"..."}' --doc-path docs/path.md
node gsdt-tools.cjs compound anti-pattern --research '{"summary":"..."}'

# Watch for events continuously
node gsdt-tools.cjs compound watch [--interval 5000]
```

---

## Profile Pipeline Commands

Read-only session analysis and artifact generation for `/gsdt:profile-user`.

```bash
# Inspect available projects and sessions
node gsdt-tools.cjs scan-sessions [--path <sessions-dir>] [--verbose] [--json]

# Extract user messages from one project
node gsdt-tools.cjs extract-messages <project> [--session <id>] [--limit N] [--path <sessions-dir>]

# Build a recency-weighted sample across projects
node gsdt-tools.cjs profile-sample [--path <sessions-dir>] [--limit 150] [--max-per-project N] [--max-chars 500]

# Turn analysis into profile artifacts
node gsdt-tools.cjs write-profile --input analysis.json [--output USER-PROFILE.md]
node gsdt-tools.cjs profile-questionnaire --answers answers.json
node gsdt-tools.cjs generate-dev-preferences [--analysis analysis.json] [--output path] [--stack ts-react]
node gsdt-tools.cjs generate-claude-profile [--analysis analysis.json] [--output path] [--global]
node gsdt-tools.cjs generate-claude-md [--output path] [--auto] [--force]
```

---

## Module Architecture

| Module | File | Exports |
|--------|------|---------|
| Core | `lib/core.cjs` | `error()`, `output()`, `parseArgs()`, shared utilities |
| State | `lib/state.cjs` | All `state` subcommands, `state-snapshot` |
| Phase | `lib/phase.cjs` | Phase CRUD, `find-phase`, `phase-plan-index`, `phases list` |
| Roadmap | `lib/roadmap.cjs` | Roadmap parsing, phase extraction, progress updates |
| Config | `lib/config.cjs` | Config read/write, section initialization |
| Verify | `lib/verify.cjs` | All verification and validation commands |
| Template | `lib/template.cjs` | Template selection and variable filling |
| Frontmatter | `lib/frontmatter.cjs` | YAML frontmatter CRUD |
| Init | `lib/init.cjs` | Compound context loading for all workflows |
| Milestone | `lib/milestone.cjs` | Milestone archival, requirements marking |
| Commands | `lib/commands.cjs` | Misc: slug, timestamp, todos, scaffold, stats, websearch |
| Model Profiles | `lib/model-profiles.cjs` | Profile resolution table |
| UAT | `lib/uat.cjs` | Cross-phase UAT/verification audit |
| Profile Output | `lib/profile-output.cjs` | Developer profile formatting |
| Profile Pipeline | `lib/profile-pipeline.cjs` | Session analysis pipeline |
| Review | `lib/review/index.cjs` | Review session lifecycle, cross-AI review, UI audit, ship review, assess merge |
| Workstream | `lib/workstream.cjs` | Workstream CRUD and progress aggregation |
| Capture | `lib/capture.cjs` | Capture fragment storage, graph I/O, routing decisions |
| Intake | `lib/intake.cjs` | Intake ledger, readiness scoring, render/materialize pipeline |
