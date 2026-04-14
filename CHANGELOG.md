# Changelog

All notable changes to GSD will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.35.0] - 2026-04-12

### Added (upstream `get-shit-done` parity)

- **Installer (`bin/install.js`)** — Merged upstream v1.35.0 behavior: runtimes **Cline**, **CodeBuddy**, **Qwen**; expanded interactive `promptRuntime` (14 runtimes + **15 = All**); **`--sdk`** / `installSdk` / `promptSdk` post-install flow; **`gsdt:`** Copilot CONV-07 alongside **`gsd:`**; **`GSDT_INSTALL_DIR` / `GSDT_COMMANDS_DIR`**; Codex **`gsdt-*`** agent sandbox; **`/gsdt-reapply-patches`** hints in `reportLocalPatches`; uninstall / manifest support for **`gsdt-*`** and legacy **`gsd-*`** artifacts.
- **`gsdt-tools.cjs`** — Subcommands **`intel`**, **`docs-init`**, **`learnings`**, **`from-gsd2`** wired to `lib/intel.cjs`, `lib/docs.cjs`, `lib/learnings.cjs`, `lib/gsd2-import.cjs` (from upstream), using **`core.planningRoot(cwd)`** for `.gsdt-planning/`.
- **Commands** — Ported missing slash commands: `undo`, `secure-phase`, `scan`, `import`, `from-gsd2`, `extract_learnings`, `explore`, `eval-review`, `docs-update`, `code-review`, `code-review-fix`, `audit-fix`, `analyze-dependencies`, `ai-integration-phase`, `intel` (normalized to **`gsdt:`** / `.gsdt-planning/` in copy).
- **`hooks/gsdt-statusline.js`** — Milestone · status · phase in the middle slot when no in-progress todo; walks **`.gsdt-planning/STATE.md`** then **`.planning/STATE.md`**; shared update cache **`~/.cache/gsdt/gsdt-update-check.json`**.

### Changed

- **Package version** — **`1.35.0`** (root and `sdk/package.json`); **`engines.node`** → **`>=22`** to match upstream.
- **Skill / flat-command prefixes** — Non-Claude installs use the **`gsdt-`** prefix for flattened commands and skills (replacing upstream-only **`gsd-`** for this fork).
- **Paths on disk** — **`gsdt-file-manifest.json`**, **`gsdt-local-patches/`**, **`gsdt-pristine/`** (replacing legacy `gsd-*` filenames where docs already referred to `gsdt`).
- **Antigravity / Codex body conversion** — **`gsdt:`** → **`gsdt-`** in **`convertClaudeToAntigravityContent`**; Codex **`convertSlashCommandsToCodexSkillMentions`** now handles **`/gsdt:`** and **`/gsdt-`** invocations; **`stripCodexGsdAgentSections`** strips **`[agents.gsdt-*]`** tables; **`installCodexConfig`** discovers **`gsdt-*.md`** agents.
- **Install verification** — Skill/command counts use **`isGsdInstallPrefixedName`** so **`gsdt-*`** installs are not reported as failed.
- **Cursor / Windsurf** — Slash-command normalization includes **`gsdt:`** alongside **`gsd:`**.

### Tests

- Updated **`tests/multi-runtime-select.test.cjs`** and **`tests/copilot-install.test.cjs`** for the new runtime map and **`gsdt-*`** naming; **`tests/antigravity-install.test.cjs`**, **`tests/codex-config.test.cjs`**, **`tests/cursor-conversion.test.cjs`**, and **`tests/windsurf-conversion.test.cjs`** aligned with **`gsdt`** command and manifest behavior.

### Author

- Jaxon

## [Unreleased]

### Added

- **`/gsdt:state-router`** — Slash command ([`commands/gsdt/state-router.md`](commands/gsdt/state-router.md)) and workflow ([`gsdt/workflows/flow-router.md`](gsdt/workflows/flow-router.md)) for **state-first routing** with a strict **JSON-only** reply contract (no markdown fences, no commentary) for Claude Code and scripting. Documented in [`gsdt/workflows/help.md`](gsdt/workflows/help.md) Quick Start. (Jaxon) *Renamed from `gsdt:flow-router` because Claude Code treats `/gsdt:…` as Skill lookup and reported “Unknown skill: gsdt:flow-router”; the skill id is `gsdt-flow-router`.*

### Changed

- **`gsdt/workflows/do.md`** — Documented Claude Code **AskUserQuestion** contract: top-level **`questions`** array only; root-level `question`/`header`/`options`/`multiSelect` cause `InputValidationError`. Dispatcher now recommends **plain-text** prompts when arguments are empty or routing is ambiguous, with optional correct JSON shape when the tool is used. (Jaxon)

### Added

- **Legacy install artifact migration** — [`bin/install.js`](bin/install.js) runs **`migrateLegacyInstallArtifacts`** before **`saveLocalPatches`**: renames **`gsd-file-manifest.json`** → **`gsdt-file-manifest.json`**, **`gsd-local-patches/`** → **`gsdt-local-patches/`**, **`gsd-pristine/`** → **`gsdt-pristine/`** when the new path is missing; if both old and new exist, logs a dim hint and does not overwrite. **`reportLocalPatches`** reads **`backup-meta.json`** from the legacy patch directory if the new one has none. **`uninstall`** also removes a leftover **`gsd-file-manifest.json`**. Cross-volume rename uses copy-then-delete. Coverage: [`tests/legacy-install-artifacts-migrate.test.cjs`](tests/legacy-install-artifacts-migrate.test.cjs). (Jaxon)
- **Migration documentation** — Added [`docs/MIGRATION-GSD-TO-GSDT.md`](docs/MIGRATION-GSD-TO-GSDT.md) as the consolidated guide for GSD→GSDT naming, disk paths, installer behavior, runtime conversion notes, intentional legacy paths (`~/.gsd/`, GSD-2 `.gsd/`), and links to `CHANGELOG` / related docs; [`docs/zh-CN/MIGRATION-GSD-TO-GSDT.md`](docs/zh-CN/MIGRATION-GSD-TO-GSDT.md) provides a short Chinese summary; indexed from [`docs/README.md`](docs/README.md); top navigation in root [`README.md`](README.md), [`README.zh-CN.md`](README.zh-CN.md), and [`docs/zh-CN/README.md`](docs/zh-CN/README.md) links to the migration guide (Chinese README points at the zh-CN summary). Follow-up **code audit** expanded that guide: per-runtime converters in [`bin/install.js`](bin/install.js) (Codex **`$gsdt-*`** vs **`$gsd-*`**, CodeBuddy **`/gsd:`**-only skill mention helper, Cursor/Windsurf markdown), plus **`planningRoot()`** in [`gsdt/bin/lib/core.cjs`](gsdt/bin/lib/core.cjs). (Jaxon)

### Changed

- **Terminology: `gsd:` → `gsdt:`** — User-facing workflows ([`gsdt/workflows/capture.md`](gsdt/workflows/capture.md), [`autonomous.md`](gsdt/workflows/autonomous.md)), [`commands/gsdt/docs-update.md`](commands/gsdt/docs-update.md), [`intel.md`](commands/gsdt/intel.md), [`new-project` / `new-milestone` workflows](gsdt/workflows/), [`docs/COMMANDS.md`](docs/COMMANDS.md), [`ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`CONFIGURATION.md`](docs/CONFIGURATION.md), and [`gsdt/bin/lib/docs.cjs`](gsdt/bin/lib/docs.cjs) / [`intel.cjs`](gsdt/bin/lib/intel.cjs) now use **`gsdt-*`** naming; generated-doc detection accepts both **`<!-- generated-by: gsdt-doc-writer -->`** and the legacy **`gsd-doc-writer`** marker. Cursor/Windsurf/Antigravity/Copilot tests updated to **`gsdt:`** fixtures. (Jaxon)
- **README & translated READMEs** — Default `git.*_branch_template` examples in configuration tables now show **`gsdt/...`** prefixes (aligned with `config.cjs` defaults). **`gsdt/references/planning-config.md`**, **`docs/zh-CN/references/planning-config.md`**, **`docs/superpowers/plans/2026-03-18-materialize-new-project-config.md`**, **`gsdt/workflows/{review,update,settings}.md`**, **`gsdt/templates/copilot-instructions.md`**, **`gsdt/templates/codebase/structure.md`**, and **`docs/ARCHITECTURE.md`** (hook cache paths) updated for **`gsdt-*`** naming; temp-file examples in review workflow use **`/tmp/gsdt-review-*`**. (Jaxon)
- Renamed GitHub repository references from `gsd-build/get-shit-done` to `gsd-build/get-shit-done-team`, aligned local-install paths and tooling (`hooks/gsdt-check-update.js`, `profile-output.cjs`, tests, `.gitignore`, secret-scan allowlists) with the on-disk install directory `gsdt/` (see `GSDT_INSTALL_DIR`), and updated installer markers to “managed by gsdt installer”. (Jaxon)
- Expanded the core reference docs so the documentation set now has a complete command/workflow/agent/artifact map: `docs/COMMANDS.md` gained a full cheat sheet plus advanced command entries, `docs/AGENTS.md` now covers the full 30-agent surface including Assess reviewers, `docs/CLI-TOOLS.md` now documents workstream/capture/intake/review/compound/profile subcommands, and `docs/ARCHITECTURE.md` now includes an end-to-end Mermaid command map. (Jaxon)
- **README configuration path** — Root [`README.md`](README.md) “Configuration Reference” sentence now states settings live at **`.gsdt-planning/config.json`** with a legacy **`.claude/.gsdt-planning/config.json`** note, matching `planningRoot()` and [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md). Follow-up: all remaining README references to **`.claude/.gsdt-planning/`** (new-project outputs, quick mode, command tables, `commit_docs`, security hook) now use the default **`.gsdt-planning/`** path with explicit **legacy** callouts where relevant, plus a **Planning directory** paragraph linking to [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md). (Jaxon)
- **Planning path consistency (docs)** — [`CONTRIBUTING.md`](CONTRIBUTING.md) test-helper table now matches **`createTempProject()`** (`.gsdt-planning/`). [`agents/gsdt-codebase-mapper.md`](agents/gsdt-codebase-mapper.md) output paths use **`.gsdt-planning/codebase/`**. [`docs/superpowers/specs/2026-03-20-multi-project-workspaces-design.md`](docs/superpowers/specs/2026-03-20-multi-project-workspaces-design.md) uses **`.gsdt-planning/`** at the workspace root with a legacy callout. [`docs/zh-CN/README.md`](docs/zh-CN/README.md) configuration section aligned with English README + [`docs/MIGRATION-GSD-TO-GSDT.md`](docs/MIGRATION-GSD-TO-GSDT.md) planning-root wording updated. (Jaxon)
- **Planning path consistency (full sweep)** — [`命令.txt`](命令.txt) / [`task-flow.txt`](task-flow.txt) internal notes use **`.gsdt-planning/`** with a legacy callout in `命令.txt`. [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md), [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md), [`docs/zh-CN/USER-GUIDE.md`](docs/zh-CN/USER-GUIDE.md), and [`docs/README.md`](docs/README.md) document default vs legacy paths and link **`planningRoot()`** / [`CONFIGURATION.md`](docs/CONFIGURATION.md). [`.github/ISSUE_TEMPLATE/bug_report.yml`](.github/ISSUE_TEMPLATE/bug_report.yml) and [`.github/workflows/security-scan.yml`](.github/workflows/security-scan.yml) prefer **`.gsdt-planning/`** while still covering legacy **`.claude/.gsdt-planning/`** in diagnostics and PR checks. [`gsdt/bin/lib/state.cjs`](gsdt/bin/lib/state.cjs) WAITING.json comment aligned with `planningDir(cwd)`. (Jaxon)
- **Documentation locales** — Removed Japanese, Korean, and Portuguese top-level READMEs (`README.ja-JP.md`, `README.ko-KR.md`, `README.pt-BR.md`). The repository now maintains **English** (root [`README.md`](README.md), [`docs/*.md`](docs/)) and **简体中文** ([`README.zh-CN.md`](README.zh-CN.md), [`docs/zh-CN/`](docs/zh-CN/)) only; [`docs/README.md`](docs/README.md) language index updated accordingly. (Jaxon)

### Fixed
- Aligned `agent-skills` workflow routing to canonical concrete agent names (`gsdt-research-synthesizer`, `gsdt-ui-auditor`, `gsdt-advisor-researcher`), added reviewer/fixer and `execute-plan` injection coverage, and locked the behavior with workflow contract tests and docs. (Jaxon)
- Unified stale user-facing `GSD` command markers to `GSDT` in issue templates, reference notes, and the install terminal asset so examples consistently show `/gsdt:*` commands and `gsdt-*` agent names.
- Cleaned up remaining stale naming in the bug report install options and a `phase-runner` plan-check comment so the repo no longer mixes `get-shit-done-cc`, `gsd-plan-checker`, and `GSDT` terminology in these spots.
- Updated remaining stale install-package and install-path references to `gsdt` / `~/.claude/gsdt/` in diagnostics, terminal artwork, notes, and debugger guidance.
- Normalized core docs, workflow prompts, agent descriptions, and translated markdown from `GSD` to `GSDT` where they describe the current product, commands, workflows, or planning artifacts, while leaving unrelated `$GSD Token` branding untouched.
- Normalized outward-facing planning-directory references in multi-language `README` files, `CONTRIBUTING.md`, the `gsdt-codebase-mapper` agent prompt, and the multi-workspace design spec to use `.gsdt-planning/` instead of stale legacy `.claude/.gsdt-planning/`, and added regression coverage to keep those outer layers aligned with runtime behavior. (Jaxon)

### Added
- Added first-class codebase-analysis ignore support via `planning.map_ignore` and repo-root `.gsdt-mapignore`, threaded through config defaults, `init map-codebase`, `init phase-op`, `init milestone-op`, mapper/discuss/plant-seed workflow prompts, and analyzer guidance so generated or vendored paths can be excluded consistently in `/gsdt:map-codebase`, both `/gsdt:discuss-phase` scout modes, `/gsdt:autonomous` smart discuss, and `/gsdt:plant-seed`. (Jaxon)
- Added `/gsdt:intake` command and `gsdt/workflows/intake.md` for weakly-interrupting, semantic-first intake of freeform ideas, constraints, preferences, technical enablers, and open questions.
- Added `docs/WORKFLOWS.md` and `docs/REFERENCE-MAP.md` as dedicated references for the full internal workflow inventory plus the complete `command -> workflow -> agent -> artifact` mapping and practical reverse lookup tables. (Jaxon)
- Added dedicated `gsdt:intake-*` command skills and workflow prompts for semantic normalization, unit resolution, readiness assessment, and brief drafting: `intake-normalize`, `intake-resolve-units`, `intake-assess-readiness`, and `intake-write-brief`.
- Added deterministic `intake` CLI support in `intake.cjs` and `gsdt-tools.cjs` for `state`, `save-raw`, `merge`, and `decide`, including cold-start readiness, phase targeting, and existing-plan guards.
- Added deterministic `intake render` / `intake materialize` subcommands to write `.claude/.gsdt-intake/cards.md`, `.claude/.gsdt-intake/brief.md`, and phase-scoped `*-INTAKE.md` artifacts from the ledger and readiness state.
- Added intake regression coverage with command/workflow contract tests and CLI behavior tests for cold start, initialized project routing, and duplicate semantic unit merging.
- Added intake schema tests, rendered-artifact tests, fixture-driven prompt-behavior tests, and reusable fixture harness utilities under `tests/helpers/` and `tests/fixtures/intake/`.
- Added live-model intake verification harness (`run-live-model`, `intake-live-harness`, `intake-assertions`) plus skipped-by-default integration/stability tests gated by `GSDT_INTAKE_LIVE_MODEL_COMMAND`.
- Added adversarial intake fixtures covering prompt-injection-style input, technical-note-only input, and conflicting constraints to ensure conservative semantic routing under dirty inputs.
- Added mixed-layer intake regression coverage for `--resolution-file`, `--assessment-file`, and `--artifacts-file` so AI semantic outputs can be applied behind deterministic CLI boundaries.
- Added GSDT Compound automation contract files: `gsdt/references/compound-schema.yaml`, `compound-yaml-schema.md`, and `compound-resolution-template.md` for bug-track knowledge capture.
- Added structured Compound event normalization, dedupe, event store, and background `compound dispatch` / `compound emit` pipeline in `compound.cjs`.
- Added Compound contract tests covering schema files, dispatch behavior, candidate-to-diagnosed upgrades, dedupe, and workflow automation guardrails.
- Added Assess contract files: `gsdt/references/assess-findings-schema.json`, `assess-output-template.md`, and `gsdt/workflows/assess.md` for phase-scoped quality closure.
- Added `review assess` support in `assess.cjs` / `review/index.cjs` to merge reviewer outputs, route safe-auto vs blocking findings, write `*-ASSESS.{md,json}` artifacts, and bridge resolved learnings into Compound.
- Added Assess tests covering merge behavior, routing, CLI artifact generation, compound emission, and execute-phase workflow contracts.
- Added Assess prompt assets mirroring the plugin's control bones in a GSDT-native way: `assess-subagent-template.md`, `assess-persona-catalog.md`, `assess-diff-scope.md`, `assess-review-output-template.md`, and `assess-reviewers.md`.
- Added Assess prompt contract tests covering reviewer prompt assets, automation rules, and richer schema metadata.
- Added prompt-driven Assess reviewer agents under `agents/` for correctness, testing, maintainability, project standards, learnings, security, performance, reliability, CLI readiness, UI regression, agent surface, and bounded safe-auto fixing.

### Changed
- **Planning directory default**: project planning artifacts now default to **`<project>/.gsdt-planning/`** at the repo root instead of **`.claude/.gsdt-planning/`**, reducing IDE permission prompts on `.claude/` writes; legacy `.claude/.gsdt-planning/` is still detected when present. `buildNewProjectConfig` reads API keys and `defaults.json` from **`~/.gsd/`** (aligned with init and tests).
- Updated `README.md`, `docs/COMMANDS.md`, and `docs/FEATURES.md` to document `/gsdt:intake` as a quiet semantic intake entrypoint alongside `/gsdt:do` and `/gsdt:note`.
- Updated `intake materialize` output to include the exact downstream slash command that would be dispatched for cold-start and phase-ready handoffs, making brief consumption boundaries directly testable.
- Refactored `/gsdt:intake` into a mixed-layered flow: AI now owns semantic resolution/readiness/artifact drafting in `gsdt/workflows/intake.md`, while `intake.cjs` applies deterministic guards, writes artifacts, and preserves safe dispatch boundaries.
- Updated `gsdt/workflows/intake.md` to explicitly invoke the new `gsdt:intake-*` subskills via `Skill(...)`, while preserving deterministic `intake merge`, `intake decide`, and `intake materialize` boundaries.
- Extended `intake merge`, `intake decide`, and `intake materialize` to accept `--resolution-file`, `--assessment-file`, and `--artifacts-file`, allowing semantic AI outputs to plug into the existing ledger/readiness pipeline without removing deterministic fallbacks.
- Cleaned remaining stale test fixtures that still referenced legacy repo paths like `get-shit-done/...`, `commands/gsd`, and old `gsd:*` workflow assertions, aligning regression coverage with the current `gsdt/` layout and `gsdt:*` source prompts.
- Repaired runtime install bookkeeping drift so non-Claude runtimes continue installing `gsd-*` skills/commands while correctly copying, manifesting, and uninstalling `gsdt-*` agent artifacts and `gsdt` engine files.
- Added the missing `gsdt-review-fixer` write-agent safeguards and filled missing `<available_agent_types>` listings for Assess / execute-phase workflow spawning contracts.
- Completed the cross-runtime prefix cleanup for Codex, Cursor, Windsurf, and Antigravity regression coverage by aligning source prompt conversions to `gsdt:*`, fixing Codex managed-agent stripping for both legacy/current prefixes, and normalizing the Codex update hook path to `gsdt-check-update.js`.
- Completed the `compound hook` pipeline: added `post-commit` event support, heuristic candidate/diagnosed routing from commit metadata, canonical template-based hook installation, and regression tests for hook dispatch/install behavior.
- Removed the unused duplicate `gsdt/commands/gsdt/workstreams.md`; `commands/gsdt/workstreams.md` remains the canonical slash-command source used by installation manifests.
- Enforced cold-start capture gate: when `ROADMAP.md` is missing, workflows no longer allow direct `discuss-phase`; they must auto-trigger `new-project` first, then auto-enter `discuss-phase` only after roadmap creation.
- Updated capture workflow automation to explicitly trigger `/gsdt:new-project --auto` from merged idea fragments and verify roadmap existence before auto-advancing.
- Added deterministic `capture decide` routing with dual thresholds (semantic + structural fallback) to prevent cold-start deadlocks and enable auto-advance decisions.
- Added `/gsdt:auto` command/workflow as one-click entrypoint for automatic capture -> decision -> routing with one-line status updates and retry policy guidance.
- Added capture decision tests covering cold-start collect-more, auto new-project trigger, and discuss trigger only after roadmap exists.
- Updated `/gsdt:do` routing preference to prioritize `/gsdt:auto` for startup/open-ended intents, reducing manual command selection.
- Updated `/gsdt:help` reference to present `/gsdt:auto` as the default quick-start and core workflow entrypoint.
- Updated `/gsdt:new-project --auto` workflow to reuse existing `.gsdt-planning/config.json` (such as from `/gsdt:capture`) and skip repeated config questions in that path.
- Updated `diagnose-issues`, `debug`, `verify-work`, `execute-phase`, and `compound-learning` so Compound runs as a non-blocking sidecar through the unified dispatch pipeline without changing existing `/gsdt:*` entrypoints.
- Updated `execute-phase` so passed verification now enters an internal Assess step before roadmap completion, and assess blockers route back into the existing gap-closure loop.
- Extended the Compound event contract to recognize `assess` as a first-class event source for resolved learnings.
- Refined Assess into a three-layer prompt architecture with automatic reviewer selection, no interactive question steps, and richer findings metadata (`why_it_matters`, `scope_tier`, `fix_risk`, `verification_hint`) preserved through `assess.cjs`.
- Expanded Assess defaults and markdown artifacts to emphasize maintainability/project-standards review, coverage reporting, and reusable learnings links while keeping the flow fully automatic.
- Updated Assess references and workflow orchestration so reviewer selection now maps to concrete `gsdt-*-reviewer` agents, standards paths are passed lazily, and review/fix tasks are described as real `Task()`-based prompt-driven steps instead of static reference-only text.

### Author
- Jaxon

## [1.30.0] - 2026-03-26

### Added
- **GSD SDK** — Headless TypeScript SDK (`@gsdt/sdk`) with `gsdt-sdk init` and `gsdt-sdk auto` CLI commands for autonomous project execution
- **`--sdk` installer flag** — Optionally install the GSD SDK during setup (interactive prompt or `--sdk` flag)

## [1.29.0] - 2026-03-25

### Added
- **Windsurf runtime support** — Full installation and command conversion for Windsurf (Codeium)
- **Agent skill injection** — Inject project-specific skills into subagents via `agent_skills` config section
- **UI-phase and UI-review steps** in autonomous workflow
- **Security scanning CI** — Prompt injection, base64, and secret scanning workflows
- **Portuguese (pt-BR) documentation**
- **Korean (ko-KR) documentation**
- **Japanese (ja-JP) documentation**

### Changed
- Repository references updated from `glittercowboy` to `gsd-build`
- Korean translations refined from formal -십시오 to natural -세요 style

### Fixed
- Frontmatter `must_haves` parser handles any YAML indentation width
- `findProjectRoot` returns startDir when it already contains `.gsdt-planning/`
- Agent workflows include `<available_agent_types>` for named agent spawning
- Begin-phase preserves Status/LastActivity/Progress in Current Position
- Missing GSD agents detected with warning when `subagent_type` falls back to general-purpose
- Codex re-install repairs trapped non-boolean keys under `[features]`
- Invalid `\Z` regex anchor replaced and redundant pattern removed
- Hook field validation prevents silent `settings.json` rejection
- Codex preserves top-level config keys and uses absolute agent paths (≥0.116)
- Windows shell robustness, `project_root` detection, and hook stdin safety
- Brownfield project detection expanded to Android, Kotlin, Gradle, and 15+ ecosystems
- Verify-work checkpoint rendering hardened
- Worktree agents get `permissionMode: acceptEdits`
- Security scan self-detection and Windows test compatibility

## [1.28.0] - 2026-03-22

### Added
- **Workstream namespacing** — Parallel milestone work via `/gsdt:workstreams`
- **Multi-project workspace commands** — Manage multiple GSD projects from a single root
- **`/gsdt:forensics` command** — Post-mortem workflow investigation
- **`/gsdt:milestone-summary` command** — Post-build onboarding for completed milestones
- **`workflow.skip_discuss` setting** — Bypass discuss-phase in autonomous mode
- **`workflow.discuss_mode` assumptions config** — Control discuss-phase behavior
- **UI-phase recommendation** — Automatically surfaced for UI-heavy phases
- **CLAUDE.md compliance** — Added as plan-checker Dimension 10
- **Data-flow tracing, environment audit, and behavioral spot-checks** in verification
- **Multi-runtime selection** in interactive installer
- **Text mode support** for plan-phase workflow
- **"Follow the Indirection" debugging technique** in gsdt-debugger
- **`--reviews` flag** for `gsdt:plan-phase`
- **Temp file reaper** — Prevents unbounded /tmp accumulation

### Changed
- Test matrix optimized from 9 containers down to 4
- Copilot skill/agent counts computed dynamically from source dirs
- Wave-specific execution support in execute-phase

### Fixed
- Windows 8.3 short path failures in worktree tests
- Worktree isolation enforced for code-writing agents
- Linked worktrees respect `.gsdt-planning/` before resolving to main repo
- Path traversal prevention via workstream name sanitization
- Strategy branch created before first commit (not at execute-phase)
- `ProviderModelNotFoundError` on non-Claude runtimes
- `$HOME` used instead of `~` in installed shell command paths
- Subdirectory CWD preserved in monorepo worktrees
- Stale hook detection checking wrong directory path
- STATE.md frontmatter status preserved when body Status field missing
- Pipe truncation fix using `fs.writeSync` for stdout
- Verification gate before writing PROJECT.md in new-milestone
- Removed `jq` as undocumented hard dependency
- Discuss-phase no longer ignores workflow instructions
- Gemini CLI uses `BeforeTool` hook event instead of `PreToolUse`

## [1.27.0] - 2026-03-20

### Added
- **Advisor mode** — Research-backed discussion with parallel agents evaluating gray areas before you decide
- **Multi-repo workspace support** — Auto-detection and project root resolution for monorepos and multi-repo setups
- **Cursor CLI runtime support** — Full installation and command conversion for Cursor
- **`/gsdt:fast` command** — Trivial inline tasks that skip planning entirely
- **`/gsdt:review` command** — Cross-AI peer review of current phase or branch
- **`/gsdt:plant-seed` command** — Backlog parking lot for ideas and persistent context threads
- **`/gsdt:pr-branch` command** — Clean PR branches filtering `.gsdt-planning/` commits
- **`/gsdt:audit-uat` command** — Verification debt tracking across phases
- **`--analyze` flag for discuss-phase** — Trade-off analysis during discussion
- **`research_before_questions` config option** — Run research before discussion questions instead of after
- **Ticket-based phase identifiers** — Support for team workflows using ticket IDs
- **Worktree-aware `.gsdt-planning/` resolution** — File locking for safe parallel access
- **Discussion audit trail** — Auto-generated `DISCUSSION-LOG.md` during discuss-phase
- **Context window size awareness** — Optimized behavior for 1M+ context models
- **Exa and Firecrawl MCP support** — Additional research tools for research agents
- **Runtime State Inventory** — Researcher capability for rename/refactor phases
- **Quick-task branch support** — Isolated branches for quick-mode tasks
- **Decision IDs** — Discuss-to-plan traceability via decision identifiers
- **Stub detection** — Verifier and executor detect incomplete implementations
- **Security hardening** — Centralized `security.cjs` module with path traversal prevention, prompt injection detection/sanitization, safe JSON parsing, field name validation, and shell argument validation. PreToolUse `gsdt-prompt-guard` hook scans writes to `.gsdt-planning/` for injection patterns

### Changed
- CI matrix updated to Node 20, 22, 24 — dropped EOL Node 18
- GitHub Actions upgraded for Node 24 compatibility
- Consolidated `planningPaths()` helper across 4 modules — eliminated 34 inline path constructions
- Deduplicated code, annotated empty catches, consolidated STATE.md field helpers
- Materialize full config on new-project initialization
- Workflow enforcement guidance embedded in generated CLAUDE.md

### Fixed
- Path traversal in `readTextArgOrFile` — arguments validate paths resolve within project directory
- Codex config.toml corruption from non-boolean `[features]` keys
- Stale hooks check filtered to gsd-prefixed files only
- Universal agent name replacement for non-Claude runtimes
- `--no-verify` support for parallel executor commits
- ROADMAP fallback for plan-phase, execute-phase, and verify-work
- Copilot sequential fallback and spot-check completion detection
- `text_mode` config for Claude Code remote session compatibility
- Cursor: preserve slash-prefixed commands and unquoted skill names
- Semver 3+ segment parsing and CRLF frontmatter corruption recovery
- STATE.md parsing fixes (compound Plan field, progress tables, lifecycle extraction)
- Windows HOME sandboxing for tests
- Hook manifest tracking for local patch detection
- Cross-platform code detection and STATE.md file locking
- Auto-detect `commit_docs` from gitignore in `loadConfig`
- Context monitor hook matcher and timeout
- Codex EOL preservation when enabling hooks
- macOS `/var` symlink resolution in path validation

## [1.26.0] - 2026-03-18

### Added
- **Developer profiling pipeline** — `/gsdt:profile-user` analyzes Claude Code session history to build behavioral profiles across 8 dimensions (communication, decisions, debugging, UX, vendor choices, frustrations, learning style, explanation depth). Generates `USER-PROFILE.md`, `/gsdt:dev-preferences`, and `CLAUDE.md` profile section. Includes `--questionnaire` fallback and `--refresh` for re-analysis (#1084)
- **`/gsdt:ship` command** — PR creation from verified phase work. Auto-generates rich PR body from planning artifacts, pushes branch, creates PR via `gh`, and updates STATE.md (#829)
- **`/gsdt:next` command** — Automatic workflow advancement to the next logical step (#927)
- **Cross-phase regression gate** — Execute-phase runs prior phases' test suites after execution, catching regressions before they compound (#945)
- **Requirements coverage gate** — Plan-phase verifies all phase requirements are covered by at least one plan before proceeding (#984)
- **Structured session handoff artifact** — `/gsdt:pause-work` writes `.gsdt-planning/HANDOFF.json` for machine-readable cross-session continuity (#940)
- **WAITING.json signal file** — Machine-readable signal for decision points requiring user input (#1034)
- **Interactive executor mode** — Pair-programming style execution with step-by-step user involvement (#963)
- **MCP tool awareness** — GSD subagents can discover and use MCP server tools (#973)
- **Codex hooks support** — SessionStart hook support for Codex runtime (#1020)
- **Model alias-to-full-ID resolution** — Task API compatibility for model alias strings (#991)
- **Execution hardening** — Pre-wave dependency checks, cross-plan data contracts, and export-level spot checks (#1082)
- **Markdown normalization** — Generated markdown conforms to markdownlint standards (#1112)
- **`/gsdt:audit-uat` command** — Cross-phase audit of all outstanding UAT and verification items. Scans every phase for pending, skipped, blocked, and human_needed items. Cross-references against codebase to detect stale documentation. Produces prioritized human test plan grouped by testability
- **Verification debt tracking** — Five structural improvements to prevent silent loss of UAT/verification items when projects advance:
  - Cross-phase health check in `/gsdt:progress` (Step 1.6) surfaces outstanding items from ALL prior phases
  - `status: partial` in UAT files distinguishes incomplete testing from completed sessions
  - `result: blocked` with `blocked_by` tag for tests blocked by external dependencies (server, device, build, third-party)
  - `human_needed` verification items now persist as HUMAN-UAT.md files (trackable across sessions)
  - Phase completion and transition warnings surface verification debt non-blockingly
- **Advisor mode for discuss-phase** — Spawns parallel research agents during `/gsdt:discuss-phase` to evaluate gray areas before user decides. Returns structured comparison tables calibrated to user's vendor philosophy. Activates only when `USER-PROFILE.md` exists (#1211)

### Changed
- Test suite consolidated: runtime converters deduplicated, helpers standardized (#1169)
- Added test coverage for model-profiles, templates, profile-pipeline, profile-output (#1170)
- Documented `inherit` profile for non-Anthropic providers (#1036)

### Fixed
- Agent suggests non-existent `/gsdt:transition` — replaced with real commands (#1081, #1100)
- PROJECT.md drift and phase completion counter accuracy (#956)
- Copilot executor stuck issue — runtime compatibility fallback added (#1128)
- Explicit agent type listings prevent fallback after `/clear` (#949)
- Nested Skill calls breaking AskUserQuestion (#1009)
- Negative-heuristic `stripShippedMilestones` replaced with positive milestone lookup (#1145)
- Hook version tracking, stale hook detection, stdin timeout, session-report command (#1153, #1157, #1161, #1162)
- Hook build script syntax validation (#1165)
- Verification examples use `fetch()` instead of `curl` for Windows compatibility (#899)
- Sequential fallback for `map-codebase` on runtimes without Task tool (#1174)
- Zsh word-splitting fix for RUNTIME_DIRS arrays (#1173)
- CRLF frontmatter parsing, duplicate cwd crash, STATE.md phase transitions (#1105)
- Requirements `mark-complete` made idempotent (#948)
- Profile template paths, field names, and evidence key corrections (#1095)
- Duplicate variable declaration removed (#1101)

## [1.25.0] - 2026-03-16

### Added
- **Antigravity runtime support** — Full installation support for the Antigravity AI agent runtime (`--antigravity`), alongside Claude Code, Vibe Agent Team, Gemini, Codex, and Copilot
- **`/gsdt:do` command** — Freeform text router that dispatches natural language to the right GSD command
- **`/gsdt:note` command** — Zero-friction idea capture with append, list, and promote-to-todo subcommands
- **Context window warning toggle** — Config option to disable context monitor warnings (`hooks.context_monitor: false`)
- **Comprehensive documentation** — New `docs/` directory with feature, architecture, agent, command, CLI, and configuration guides

### Changed
- `/gsdt:discuss-phase` shows remaining discussion areas when asking to continue or move on
- `/gsdt:plan-phase` asks user about research instead of silently deciding
- Improved GitHub issue and PR templates with industry best practices
- Settings clarify balanced profile uses Sonnet for research

### Fixed
- Executor checks for untracked files after task commits
- Researcher verifies package versions against npm registry before recommending
- Health check adds CWD guard and strips archived milestones
- `core.cjs` returns `opus` directly instead of mapping to `inherit`
- Stats command corrects git and roadmap reporting
- Init prefers current milestone phase-op targets
- **Antigravity skills** — `processAttribution` was missing from `copyCommandsAsAntigravitySkills`, causing SKILL.md files to be written without commit attribution metadata
- Copilot install tests updated for UI agent count changes

## [1.24.0] - 2026-03-15

### Added
- **`/gsdt:quick --research` flag** — Spawns focused research agent before planning, composable with `--discuss` and `--full` (#317)
- **`inherit` model profile** for Vibe Agent Team — agents inherit the user's selected runtime model via `/model`
- **Persistent debug knowledge base** — resolved debug sessions append to `.gsdt-planning/debug/knowledge-base.md`, eliminating cold-start investigation on recurring issues
- **Programmatic `/gsdt:set-profile`** — runs as a script instead of LLM-driven workflow, executes in seconds instead of 30-40s

### Fixed
- ROADMAP.md searches scoped to current milestone — multi-milestone projects no longer match phases from archived milestones
- Vibe Agent Team agent frontmatter conversion — agents get correct `name:`, `model: inherit`, `mode: subagent`
- `opencode.jsonc` config files respected during install (previously only `.json` was detected) (#1053)
- Windows installer crash on EPERM/EACCES when scanning protected directories (#964)
- `gsdt-tools.cjs` uses absolute paths in all install types (#820)
- Invalid `skills:` frontmatter removed from UI agent files

## [1.23.0] - 2026-03-15

### Added
- `/gsdt:ui-phase` + `/gsdt:ui-review` — UI design contract generation and retroactive 6-pillar visual audit for frontend phases (closes #986)
- `/gsdt:stats` — project statistics dashboard: phases, plans, requirements, git metrics, and timeline
- **Copilot CLI** runtime support — install with `--copilot`, maps Claude Code tools to GitHub Copilot tools
- **`gsd-autonomous` skill** for Codex runtime — enables autonomous GSD execution
- **Node repair operator** — autonomous recovery when task verification fails: RETRY, DECOMPOSE, or PRUNE before escalating to user. Configurable via `workflow.node_repair_budget` (default: 2 attempts). Disable with `workflow.node_repair: false`
- Mandatory `read_first` and `acceptance_criteria` sections in plans to prevent shallow execution
- Mandatory `canonical_refs` section in CONTEXT.md for traceable decisions
- Quick mode uses `YYMMDD-xxx` timestamp IDs instead of auto-increment numbers

### Changed
- `/gsdt:discuss-phase` supports explicit `--batch` mode for grouped question intake

### Fixed
- `/gsdt:new-milestone` no longer resets `workflow.research` config during milestone transitions
- `/gsdt:update` is runtime-aware and targets the correct runtime directory
- Phase-complete properly updates REQUIREMENTS.md traceability (closes #848)
- Auto-advance no longer triggers without `--auto` flag (closes #1026, #932)
- `--auto` flag correctly skips interactive discussion questions (closes #1025)
- Decimal phase numbers correctly padded in init.cjs (closes #915)
- Empty-answer validation guards added to discuss-phase (closes #912)
- Tilde paths in templates prevent PII leak in `.gsdt-planning/` files (closes #987)
- Invalid `commit-docs` command replaced with `commit` in workflows (closes #968)
- Uninstall mode indicator shown in banner output (closes #1024)
- WSL + Windows Node.js mismatch detected with user warning (closes #1021)
- Deprecated Codex config keys removed to fix UI instability
- Unsupported Gemini agent `skills` frontmatter stripped for compatibility
- Roadmap `complete` checkbox overrides `disk_status` for phase detection
- Plan-phase Nyquist validation works when research is disabled (closes #1002)
- Valid Codex agent TOML emitted by installer
- Escape characters corrected in grep commands

## [1.22.4] - 2026-03-03

### Added
- `--discuss` flag for `/gsdt:quick` — lightweight pre-planning discussion to gather context before quick tasks

### Fixed
- Windows: `@file:` protocol resolution for large init payloads (>50KB) — all 32 workflow/agent files now resolve temp file paths instead of letting agents hallucinate `/tmp` paths (#841)
- Missing `skills` frontmatter on gsdt-nyquist-auditor agent

## [1.22.3] - 2026-03-03

### Added
- Verify-work auto-injects a cold-start smoke test for phases that modify server, database, seed, or startup files — catches warm-state blind spots

### Changed
- Renamed `depth` setting to `granularity` with values `coarse`/`standard`/`fine` to accurately reflect what it controls (phase count, not investigation depth). Backward-compatible migration auto-renames existing config.

### Fixed
- Installer now replaces `$HOME/.claude/` paths (not just `~/.claude/`) for non-Claude runtimes — fixes broken commands on local installs and Gemini/Vibe Agent Team/Codex installs (#905, #909)

## [1.22.2] - 2026-03-03

### Fixed
- Codex installer no longer creates duplicate `[features]` and `[agents]` sections on re-install (#902, #882)
- Context monitor hook is advisory instead of blocking non-GSD workflows
- Hooks respect `CLAUDE_CONFIG_DIR` for custom config directories
- Hooks include stdin timeout guard to prevent hanging on pipe errors
- Statusline context scaling matches autocompact buffer thresholds
- Gap closure plans compute wave numbers instead of hardcoding wave 1
- `auto_advance` config flag no longer persists across sessions
- Phase-complete scans ROADMAP.md as fallback for next-phase detection
- `getMilestoneInfo()` prefers in-progress milestone marker instead of always returning first
- State parsing supports both bold and plain field formats
- Phase counting scoped to current milestone
- Total phases derived from ROADMAP when phase directories don't exist yet
- Vibe Agent Team installer detects runtime config directory instead of hardcoding `.claude`
- Gemini hooks use `AfterTool` event instead of `PostToolUse`
- Multi-word commit messages preserved in CLI router
- Regex patterns in milestone/state helpers properly escaped
- `isGitIgnored` uses `--no-index` for tracked file detection
- AskUserQuestion freeform answer loop properly breaks on valid input
- Agent spawn types standardized across all workflows

### Changed
- Anti-heredoc instruction extended to all file-writing agents
- Agent definitions include skills frontmatter and hooks examples

### Chores
- Removed leftover `new-project.md.bak` file
- Deduplicated `extractField` and phase filter helpers into shared modules
- Added 47 agent frontmatter and spawn consistency tests

## [1.22.1] - 2026-03-02

### Added
- Discuss phase now loads prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, and all prior CONTEXT.md files) before identifying gray areas — prevents re-asking questions you've already answered in earlier phases

### Fixed
- Shell snippets in workflows use `printf` instead of `echo` to prevent jq parse errors with special characters

## [1.22.0] - 2026-02-27

### Added
- Codex multi-agent support: `request_user_input` mapping, multi-agent config, and agent role generation for Codex runtime
- Analysis paralysis guard in agents to prevent over-deliberation during planning
- Exhaustive cross-check and task-level TDD patterns in agent workflows
- Code-aware discuss phase with codebase scouting — `/gsdt:discuss-phase` now analyzes relevant source files before asking questions

### Fixed
- Update checker clears both cache paths to prevent stale version notifications
- Statusline migration regex no longer clobbers third-party statuslines
- Subagent paths use `$HOME` instead of `~` to prevent `MODULE_NOT_FOUND` errors
- Skill discovery supports both `.claude/skills/` and `.agents/skills/` paths
- `resolve-model` variable names aligned with template placeholders
- Regex metacharacters properly escaped in `stateExtractField`
- `model_overrides` and `nyquist_validation` correctly loaded from config
- `phase-plan-index` no longer returns null/empty for `files_modified`, `objective`, and `task_count`

## [1.21.1] - 2026-02-27

### Added
- Comprehensive test suite: 428 tests across 13 test files covering core, commands, config, dispatcher, frontmatter, init, milestone, phase, roadmap, state, and verify modules
- CI pipeline with GitHub Actions: 9-matrix (3 OS × 3 Node versions), c8 coverage enforcement at 70% line threshold
- Cross-platform test runner (`scripts/run-tests.cjs`) for Windows compatibility

### Fixed
- `getMilestoneInfo()` returns wrong version when shipped milestones are collapsed in `<details>` blocks
- Milestone completion stats and archive now scoped to current milestone phases only (previously counted all phases on disk including prior milestones)
- MILESTONES.md entries now insert in reverse chronological order (newest first)
- Cross-platform path separators: all user-facing file paths use forward slashes on Windows
- JSON quoting and dollar sign handling in CLI arguments on Windows
- `model_overrides` loaded from config and `resolveModelInternal` used in CLI

## [1.21.0] - 2026-02-25

### Added
- YAML frontmatter sync to STATE.md for machine-readable status tracking
- `/gsdt:add-tests` command for post-phase test generation
- Codex runtime support with skills-first installation
- Standard `project_context` block in gsdt-verifier output
- Codex changelog and usage documentation

### Changed
- Improved onboarding UX: installer now suggests `/gsdt:new-project` instead of `/gsdt:help`
- Updated Discord invite to vanity URL (discord.gg/gsd)
- Compressed Nyquist validation layer to align with GSD meta-prompt conventions
- Requirements propagation now includes `phase_req_ids` from ROADMAP to workflow agents
- Debug sessions require human verification before resolution

### Fixed
- Multi-level decimal phase handling (e.g., 72.1.1) with proper regex escaping
- `/gsdt:update` always installs latest package version
- STATE.md decision corruption and dollar sign handling
- STATE.md frontmatter mapping for requirements-completed status
- Progress bar percent clamping to prevent RangeError crashes
- `--cwd` override support in state-snapshot command

## [1.20.6] - 2025-02-23

### Added
- Context window monitor hook with WARNING/CRITICAL alerts when agent context usage exceeds thresholds
- Nyquist validation layer in plan-phase pipeline to catch quality issues before execution
- Option highlighting and gray area looping in discuss-phase for clearer preference capture

### Changed
- Refactored installer tools into 11 domain modules for maintainability

### Fixed
- Auto-advance chain no longer breaks when skills fail to resolve inside Task subagents
- Gemini CLI workflows and templates no longer incorrectly convert to TOML format
- Universal phase number parsing handles all formats consistently (decimal phases, plain numbers)

## [1.20.5] - 2026-02-19

### Fixed
- `/gsdt:health --repair` now creates timestamped backup before regenerating STATE.md (#657)

### Changed
- Subagents now discover and load project CLAUDE.md and skills at spawn time for better project context (#671, #672)
- Improved context loading reliability in spawned agents

## [1.20.4] - 2026-02-17

### Fixed
- Executor agents now update ROADMAP.md and REQUIREMENTS.md after each plan completes — previously both documents stayed unchecked throughout milestone execution
- New `requirements mark-complete` CLI command enables per-plan requirement tracking instead of waiting for phase completion
- Executor final commit includes ROADMAP.md and REQUIREMENTS.md

## [1.20.3] - 2026-02-16

### Fixed
- Milestone audit now cross-references three independent sources (VERIFICATION.md + SUMMARY frontmatter + REQUIREMENTS.md traceability) instead of single-source phase status checks
- Orphaned requirements (in traceability table but absent from all phase VERIFICATIONs) detected and forced to `unsatisfied`
- Integration checker receives milestone requirement IDs and maps findings to affected requirements
- `complete-milestone` gates on requirements completion before archival — surfaces unchecked requirements with proceed/audit/abort options
- `plan-milestone-gaps` updates REQUIREMENTS.md traceability table (phase assignments, checkbox resets, coverage count) and includes it in commit
- Gemini CLI: escape `${VAR}` shell variables in agent bodies to prevent template validation failures

## [1.20.2] - 2026-02-16

### Fixed
- Requirements tracking chain now strips bracket syntax (`[REQ-01, REQ-02]` → `REQ-01, REQ-02`) across all agents
- Verifier cross-references requirement IDs from PLAN frontmatter instead of only grepping REQUIREMENTS.md by phase number
- Orphaned requirements (mapped to phase in REQUIREMENTS.md but unclaimed by any plan) are detected and flagged

### Changed
- All `requirements` references across planner, templates, and workflows enforce MUST/REQUIRED/CRITICAL language — no more passive suggestions
- Plan checker now **fails** (blocking, not warning) when any roadmap requirement is absent from all plans
- Researcher receives phase-specific requirement IDs and must output a `<phase_requirements>` mapping table
- Phase requirement IDs extracted from ROADMAP and passed through full chain: researcher → planner → checker → executor → verifier
- Verification report requirements table expanded with Source Plan, Description, and Evidence columns

## [1.20.1] - 2026-02-16

### Fixed
- Auto-mode (`--auto`) now survives context compaction by persisting `workflow.auto_advance` to config.json on disk
- Checkpoints no longer block auto-mode: human-verify auto-approves, decision auto-selects first option (human-action still stops for auth gates)
- Plan-phase now passes `--auto` flag when spawning execute-phase
- Auto-advance clears on milestone complete to prevent runaway chains

## [1.20.0] - 2026-02-15

### Added
- `/gsdt:health` command — validates `.gsdt-planning/` directory integrity with `--repair` flag for auto-fixing config.json and STATE.md
- `--full` flag for `/gsdt:quick` — enables plan-checking (max 2 iterations) and post-execution verification on quick tasks
- `--auto` flag wired from `/gsdt:new-project` through the full phase chain (discuss → plan → execute)
- Auto-advance chains phase execution across full milestones when `workflow.auto_advance` is enabled

### Fixed
- Plans created without user context — `/gsdt:plan-phase` warns when no CONTEXT.md exists, `/gsdt:discuss-phase` warns when plans already exist (#253)
- Vibe Agent Team installer converts `general-purpose` subagent type to the opencode runtime's `general`
- `/gsdt:complete-milestone` respects `commit_docs` setting when merging branches
- Phase directories tracked in git via `.gitkeep` files

## [1.19.2] - 2026-02-15

### Added
- User-level default settings via `~/.gsdt/defaults.json` — set GSD defaults across all projects
- Per-agent model overrides — customize which Claude model each agent uses

### Changed
- Completed milestone phase directories are now archived for cleaner project structure
- Wave execution diagram added to README for clearer parallelization visualization

### Fixed
- Vibe Agent Team local installs now write config to `./.opencode/` instead of overwriting global `~/.config/opencode/`
- Large JSON payloads write to temp files to prevent truncation in tool calls
- Phase heading matching now supports `####` depth
- Phase padding normalized in insert command
- ESM conflicts prevented by renaming gsdt-tools.js to .cjs
- Config directory paths quoted in hook templates for local installs
- Settings file corruption prevented by using Write tool for file creation
- Plan-phase autocomplete fixed by removing "execution" from description
- Executor now has scope boundary and attempt limit to prevent runaway loops

## [1.19.1] - 2026-02-15

### Added
- Auto-advance pipeline: `--auto` flag on `discuss-phase` and `plan-phase` chains discuss → plan → execute without stopping. Also available as `workflow.auto_advance` config setting

### Fixed
- Phase transition routing now routes to `discuss-phase` (not `plan-phase`) when no CONTEXT.md exists — consistent across all workflows (#530)
- ROADMAP progress table plan counts are now computed from disk instead of LLM-edited — deterministic "X/Y Complete" values (#537)
- Verifier uses ROADMAP Success Criteria directly instead of deriving verification truths from the Goal field (#538)
- REQUIREMENTS.md traceability updates when a phase completes
- STATE.md updates after discuss-phase completes (#556)
- AskUserQuestion headers enforced to 12-char max to prevent UI truncation (#559)
- Agent model resolution returns `inherit` instead of hardcoded `opus` (#558)

## [1.19.0] - 2026-02-15

### Added
- Brave Search integration for researchers (requires BRAVE_API_KEY environment variable)
- GitHub issue templates for bug reports and feature requests
- Security policy for responsible disclosure
- Auto-labeling workflow for new issues

### Fixed
- UAT gaps and debug sessions now auto-resolve after gap-closure phase execution (#580)
- Fall back to ROADMAP.md when phase directory missing (#521)
- Template hook paths for Vibe Agent Team/Gemini runtimes (#585)
- Accept both `##` and `###` phase headers, detect malformed ROADMAPs (#598, #599)
- Use `{phase_num}` instead of ambiguous `{phase}` for filenames (#601)
- Add package.json to prevent ESM inheritance issues (#602)

## [1.18.0] - 2026-02-08

### Added
- `--auto` flag for `/gsdt:new-project` — runs research → requirements → roadmap automatically after config questions. Expects idea document via @ reference (e.g., `/gsdt:new-project --auto @prd.md`)

### Fixed
- Windows: SessionStart hook now spawns detached process correctly
- Windows: Replaced HEREDOC with literal newlines for git commit compatibility
- Research decision from `/gsdt:new-milestone` now persists to config.json

## [1.17.0] - 2026-02-08

### Added
- **gsdt-tools verification suite**: `verify plan-structure`, `verify phase-completeness`, `verify references`, `verify commits`, `verify artifacts`, `verify key-links` — deterministic structural checks
- **gsdt-tools frontmatter CRUD**: `frontmatter get/set/merge/validate` — safe YAML frontmatter operations with schema validation
- **gsdt-tools template fill**: `template fill summary/plan/verification` — pre-filled document skeletons
- **gsdt-tools state progression**: `state advance-plan`, `state update-progress`, `state record-metric`, `state add-decision`, `state add-blocker`, `state resolve-blocker`, `state record-session` — automates STATE.md updates
- **Local patch preservation**: Installer now detects locally modified GSD files, backs them up to `gsdt-local-patches/`, and creates a manifest for restoration
- `/gsdt:reapply-patches` command to merge local modifications back after GSD updates

### Changed
- Agents (executor, planner, plan-checker, verifier) now use gsdt-tools for state updates and verification instead of manual markdown parsing
- `/gsdt:update` workflow now notifies about backed-up local patches and suggests `/gsdt:reapply-patches`

### Fixed
- Added workaround for Claude Code `classifyHandoffIfNeeded` bug that causes false agent failures — execute-phase and quick workflows now spot-check actual output before reporting failure

## [1.16.0] - 2026-02-08

### Added
- 10 new gsdt-tools CLI commands that replace manual AI orchestration of mechanical operations:
  - `phase add <desc>` — append phase to roadmap + create directory
  - `phase insert <after> <desc>` — insert decimal phase
  - `phase remove <N> [--force]` — remove phase with full renumbering
  - `phase complete <N>` — mark done, update state + roadmap, detect milestone end
  - `roadmap analyze` — unified roadmap parser with disk status
  - `milestone complete <ver> [--name]` — archive roadmap/requirements/audit
  - `validate consistency` — check phase numbering and disk/roadmap sync
  - `progress [json|table|bar]` — render progress in various formats
  - `todo complete <file>` — move todo from pending to completed
  - `scaffold [context|uat|verification|phase-dir]` — template generation

### Changed
- Workflows now delegate deterministic operations to gsdt-tools CLI, reducing token usage and errors:
  - `remove-phase.md`: 13 manual steps → 1 CLI call + confirm + commit
  - `add-phase.md`: 6 manual steps → 1 CLI call + state update
  - `insert-phase.md`: 7 manual steps → 1 CLI call + state update
  - `complete-milestone.md`: archival delegated to `milestone complete`
  - `progress.md`: roadmap parsing delegated to `roadmap analyze`

### Fixed
- Execute-phase now correctly spawns `gsdt-executor` subagents instead of generic task agents
- `commit_docs=false` setting now respected in all `.gsdt-planning/` commit paths (execute-plan, debugger, reference docs all route through gsdt-tools CLI)
- Execute-phase orchestrator no longer bloats context by embedding file content — passes paths instead, letting subagents read in their fresh context
- Windows: Normalized backslash paths in gsdt-tools invocations (contributed by @rmindel)

## [1.15.0] - 2026-02-08

### Changed
- Optimized workflow context loading to eliminate redundant file reads, reducing token usage by ~5,000-10,000 tokens per workflow execution

## [1.14.0] - 2026-02-08

### Added
- Context-optimizing parsing commands in gsdt-tools (`phase-plan-index`, `state-snapshot`, `summary-extract`) — reduces agent context usage by returning structured JSON instead of raw file content

### Fixed
- Installer no longer deletes opencode.json on JSONC parse errors — now handles comments, trailing commas, and BOM correctly (#474)

## [1.13.0] - 2026-02-08

### Added
- `gsdt-tools history-digest` — Compiles phase summaries into structured JSON for faster context loading
- `gsdt-tools phases list` — Lists phase directories with filtering (replaces fragile `ls | sort -V` patterns)
- `gsdt-tools roadmap get-phase` — Extracts phase sections from ROADMAP.md
- `gsdt-tools phase next-decimal` — Calculates next decimal phase number for insert operations
- `gsdt-tools state get/patch` — Atomic STATE.md field operations
- `gsdt-tools template select` — Chooses summary template based on plan complexity
- Summary template variants: minimal (~30 lines), standard (~60 lines), complex (~100 lines)
- Test infrastructure with 22 tests covering new commands

### Changed
- Planner uses two-step context assembly: digest for selection, full SUMMARY for understanding
- Agents migrated from bash patterns to structured gsdt-tools commands
- Nested YAML frontmatter parsing now handles `dependency-graph.provides`, `tech-stack.added` correctly

## [1.12.1] - 2026-02-08

### Changed
- Consolidated workflow initialization into compound `init` commands, reducing token usage and improving startup performance
- Updated 24 workflow and agent files to use single-call context gathering instead of multiple atomic calls

## [1.12.0] - 2026-02-07

### Changed
- **Architecture: Thin orchestrator pattern** — Commands now delegate to workflows, reducing command file size by ~75% and improving maintainability
- **Centralized utilities** — New `gsdt-tools.cjs` (11 functions) replaces repetitive bash patterns across 50+ files
- **Token reduction** — ~22k characters removed from affected command/workflow/agent files
- **Condensed agent prompts** — Same behavior with fewer words (executor, planner, verifier, researcher agents)

### Added
- `gsdt-tools.cjs` CLI utility with functions: state load/update, resolve-model, find-phase, commit, verify-summary, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section

## [1.11.2] - 2026-02-05

### Added
- Security section in README with Claude Code deny rules for sensitive files

### Changed
- Install respects `attribution.commit` setting for opencode-compatible runtimes (#286)

### Fixed
- **CRITICAL:** Prevent API keys from being committed via `/gsdt:map-codebase` (#429)
- Enforce context fidelity in planning pipeline - agents now honor CONTEXT.md decisions (#326, #216, #206)
- Executor verifies task completion to prevent hallucinated success (#315)
- Auto-create `config.json` when missing during `/gsdt:settings` (#264)
- `/gsdt:update` respects local vs global install location
- Researcher writes RESEARCH.md regardless of `commit_docs` setting
- Statusline crash handling, color validation, git staging rules
- Statusline.js reference updated during install (#330)
- Parallelization config setting now respected (#379)
- ASCII box-drawing vs text content with diacritics (#289)
- Removed broken gsdt-gemini link (404)

## [1.11.1] - 2026-01-31

### Added
- Git branching strategy configuration with three options:
  - `none` (default): commit to current branch
  - `phase`: create branch per phase (`gsdt/phase-{N}-{slug}`)
  - `milestone`: create branch per milestone (`gsdt/{version}-{slug}`)
- Squash merge option at milestone completion (recommended) with merge-with-history alternative
- Context compliance verification dimension in plan checker — flags if plans contradict user decisions

### Fixed
- CONTEXT.md from `/gsdt:discuss-phase` now properly flows to all downstream agents (researcher, planner, checker, revision loop)

## [1.10.1] - 2025-01-30

### Fixed
- Gemini CLI agent loading errors that prevented commands from executing

## [1.10.0] - 2026-01-29

### Added
- Native Gemini CLI support — install with `--gemini` flag or select from interactive menu
- New `--all` flag to install for Claude Code, Vibe Agent Team, and Gemini simultaneously

### Fixed
- Context bar now shows 100% at actual 80% limit (was scaling incorrectly)

## [1.9.12] - 2025-01-23

### Removed
- `/gsdt:whats-new` command — use `/gsdt:update` instead (shows changelog with cancel option)

### Fixed
- Restored auto-release GitHub Actions workflow

## [1.9.11] - 2026-01-23

### Changed
- Switched to manual npm publish workflow (removed GitHub Actions CI/CD)

### Fixed
- Discord badge now uses static format for reliable rendering

## [1.9.10] - 2026-01-23

### Added
- Discord community link shown in installer completion message

## [1.9.9] - 2026-01-23

### Added
- `/gsdt:join-discord` command to quickly access the GSD Discord community invite link

## [1.9.8] - 2025-01-22

### Added
- Uninstall flag (`--uninstall`) to cleanly remove GSD from global or local installations

### Fixed
- Context file detection now matches filename variants (handles both `CONTEXT.md` and `{phase}-CONTEXT.md` patterns)

## [1.9.7] - 2026-01-22

### Fixed
- Vibe Agent Team installer now uses correct XDG-compliant config path (`~/.config/opencode/`) instead of `~/.opencode/`
- Vibe Agent Team commands use flat structure (`command/gsdt-help.md`) matching the opencode CLI layout
- Vibe Agent Team permissions written to `~/.config/opencode/opencode.json`

## [1.9.6] - 2026-01-22

### Added
- Interactive runtime selection: installer now prompts to choose Claude Code, Vibe Agent Team, or both
- Native Vibe Agent Team support: `--opencode` / `--vibe-agent-team` flag converts GSD to opencode-compatible format automatically
- `--both` flag to install for both Claude Code and Vibe Agent Team in one command
- Auto-configures `~/.opencode.json` permissions for seamless GSD doc access

### Changed
- Installation flow now asks for runtime first, then location
- Updated README with new installation options

## [1.9.5] - 2025-01-22

### Fixed
- Subagents can now access MCP tools (Context7, etc.) - workaround for Claude Code bug #13898
- Installer: Escape/Ctrl+C now cancels instead of installing globally
- Installer: Fixed hook paths on Windows
- Removed stray backticks in `/gsdt:new-project` output

### Changed
- Condensed verbose documentation in templates and workflows (-170 lines)
- Added CI/CD automation for releases

## [1.9.4] - 2026-01-21

### Changed
- Checkpoint automation now enforces automation-first principle: Claude starts servers, handles CLI installs, and fixes setup failures before presenting checkpoints to users
- Added server lifecycle protocol (port conflict handling, background process management)
- Added CLI auto-installation handling with safe-to-install matrix
- Added pre-checkpoint failure recovery (fix broken environment before asking user to verify)
- DRY refactor: checkpoints.md is now single source of truth for automation patterns

## [1.9.2] - 2025-01-21

### Removed
- **Codebase Intelligence System** — Removed due to overengineering concerns
  - Deleted `/gsdt:analyze-codebase` command
  - Deleted `/gsdt:query-intel` command
  - Removed SQLite graph database and sql.js dependency (21MB)
  - Removed intel hooks (gsd-intel-index.js, gsd-intel-session.js, gsd-intel-prune.js)
  - Removed entity file generation and templates

### Fixed
- new-project now properly includes model_profile in config

## [1.9.0] - 2025-01-20

### Added
- **Model Profiles** — `/gsdt:set-profile` for quality/balanced/budget agent configurations
- **Workflow Settings** — `/gsdt:settings` command for toggling workflow behaviors interactively

### Fixed
- Orchestrators now inline file contents in Task prompts (fixes context issues with @ references)
- Tech debt from milestone audit addressed
- All hooks now use `gsd-` prefix for consistency (statusline.js → gsdt-statusline.js)

## [1.8.0] - 2026-01-19

### Added
- Uncommitted planning mode: Keep `.gsdt-planning/` local-only (not committed to git) via `planning.commit_docs: false` in config.json. Useful for OSS contributions, client work, or privacy preferences.
- `/gsdt:new-project` now asks about git tracking during initial setup, letting you opt out of committing planning docs from the start

## [1.7.1] - 2026-01-19

### Fixed
- Quick task PLAN and SUMMARY files now use numbered prefix (`001-PLAN.md`, `001-SUMMARY.md`) matching regular phase naming convention

## [1.7.0] - 2026-01-19

### Added
- **Quick Mode** (`/gsdt:quick`) — Execute small, ad-hoc tasks with GSD guarantees but skip optional agents (researcher, checker, verifier). Quick tasks live in `.gsdt-planning/quick/` with their own tracking in STATE.md.

### Changed
- Improved progress bar calculation to clamp values within 0-100 range
- Updated documentation with comprehensive Quick Mode sections in help.md, README.md, and GSD-STYLE.md

### Fixed
- Console window flash on Windows when running hooks
- Empty `--config-dir` value validation
- Consistent `allowed-tools` YAML format across agents
- Corrected agent name in research-phase heading
- Removed hardcoded 2025 year from search query examples
- Removed dead gsdt-phase-researcher agent references
- Integrated unused reference files into documentation

### Housekeeping
- Added homepage and bugs fields to package.json

## [1.6.4] - 2026-01-17

### Fixed
- Installation on WSL2/non-TTY terminals now works correctly - detects non-interactive stdin and falls back to global install automatically
- Installation now verifies files were actually copied before showing success checkmarks
- Orphaned `gsd-notify.sh` hook from previous versions is now automatically removed during install (both file and settings.json registration)

## [1.6.3] - 2025-01-17

### Added
- `--gaps-only` flag for `/gsdt:execute-phase` — executes only gap closure plans after verify-work finds issues, eliminating redundant state discovery

## [1.6.2] - 2025-01-17

### Changed
- README restructured with clearer 6-step workflow: init → discuss → plan → execute → verify → complete
- Discuss-phase and verify-work now emphasized as critical steps in core workflow documentation
- "Subagent Execution" section replaced with "Multi-Agent Orchestration" explaining thin orchestrator pattern and 30-40% context efficiency
- Brownfield instructions consolidated into callout at top of "How It Works" instead of separate section
- Phase directories now created at discuss/plan-phase instead of during roadmap creation

## [1.6.1] - 2025-01-17

### Changed
- Installer performs clean install of GSD folders, removing orphaned files from previous versions
- `/gsdt:update` shows changelog and asks for confirmation before updating, with clear warning about what gets replaced

## [1.6.0] - 2026-01-17

### Changed
- **BREAKING:** Unified `/gsdt:new-milestone` flow — now mirrors `/gsdt:new-project` with questioning → research → requirements → roadmap in a single command
- Roadmapper agent now references templates instead of inline structures for easier maintenance

### Removed
- **BREAKING:** `/gsdt:discuss-milestone` — consolidated into `/gsdt:new-milestone`
- **BREAKING:** `/gsdt:create-roadmap` — integrated into project/milestone flows
- **BREAKING:** `/gsdt:define-requirements` — integrated into project/milestone flows
- **BREAKING:** `/gsdt:research-project` — integrated into project/milestone flows

### Added
- `/gsdt:verify-work` now includes next-step routing after verification completes

## [1.5.30] - 2026-01-17

### Fixed
- Output templates in `plan-phase`, `execute-phase`, and `audit-milestone` now render markdown correctly instead of showing literal backticks
- Next-step suggestions now consistently recommend `/gsdt:discuss-phase` before `/gsdt:plan-phase` across all routing paths

## [1.5.29] - 2025-01-16

### Changed
- Discuss-phase now uses domain-aware questioning with deeper probing for gray areas

### Fixed
- Windows hooks now work via Node.js conversion (statusline, update-check)
- Phase input normalization at command entry points
- Removed blocking notification popups (gsd-notify) on all platforms

## [1.5.28] - 2026-01-16

### Changed
- Consolidated milestone workflow into single command
- Merged domain expertise skills into agent configurations
- **BREAKING:** Removed `/gsdt:execute-plan` command (use `/gsdt:execute-phase` instead)

### Fixed
- Phase directory matching now handles both zero-padded (05-*) and unpadded (5-*) folder names
- Map-codebase agent output collection

## [1.5.27] - 2026-01-16

### Fixed
- Orchestrator corrections between executor completions are now committed (previously left uncommitted when orchestrator made small fixes between waves)

## [1.5.26] - 2026-01-16

### Fixed
- Revised plans now get committed after checker feedback (previously only initial plans were committed, leaving revisions uncommitted)

## [1.5.25] - 2026-01-16

### Fixed
- Stop notification hook no longer shows stale project state (now uses session-scoped todos only)
- Researcher agent now reliably loads CONTEXT.md from discuss-phase

## [1.5.24] - 2026-01-16

### Fixed
- Stop notification hook now correctly parses STATE.md fields (was always showing "Ready for input")
- Planner agent now reliably loads CONTEXT.md and RESEARCH.md files

## [1.5.23] - 2025-01-16

### Added
- Cross-platform completion notification hook (Mac/Linux/Windows alerts when Claude stops)
- Phase researcher now loads CONTEXT.md from discuss-phase to focus research on user decisions

### Fixed
- Consistent zero-padding for phase directories (01-name, not 1-name)
- Plan file naming: `{phase}-{plan}-PLAN.md` pattern restored across all agents
- Double-path bug in researcher git add command
- Removed `/gsdt:research-phase` from next-step suggestions (use `/gsdt:plan-phase` instead)

## [1.5.22] - 2025-01-16

### Added
- Statusline update indicator — shows `⬆ /gsdt:update` when a new version is available

### Fixed
- Planner now updates ROADMAP.md placeholders after planning completes

## [1.5.21] - 2026-01-16

### Added
- GSD brand system for consistent UI (checkpoint boxes, stage banners, status symbols)
- Research synthesizer agent that consolidates parallel research into SUMMARY.md

### Changed
- **Unified `/gsdt:new-project` flow** — Single command now handles questions → research → requirements → roadmap (~10 min)
- Simplified README to reflect streamlined workflow: new-project → plan-phase → execute-phase
- Added optional `/gsdt:discuss-phase` documentation for UI/UX/behavior decisions before planning

### Fixed
- verify-work now shows clear checkpoint box with action prompt ("Type 'pass' or describe what's wrong")
- Planner uses correct `{phase}-{plan}-PLAN.md` naming convention
- Planner no longer surfaces internal `user_setup` in output
- Research synthesizer commits all research files together (not individually)
- Project researcher agent can no longer commit (orchestrator handles commits)
- Roadmap requires explicit user approval before committing

## [1.5.20] - 2026-01-16

### Fixed
- Research no longer skipped based on premature "Research: Unlikely" predictions made during roadmap creation. The `--skip-research` flag provides explicit control when needed.

### Removed
- `Research: Likely/Unlikely` fields from roadmap phase template
- `detect_research_needs` step from roadmap creation workflow
- Roadmap-based research skip logic from planner agent

## [1.5.19] - 2026-01-16

### Changed
- `/gsdt:discuss-phase` redesigned with intelligent gray area analysis — analyzes phase to identify discussable areas (UI, UX, Behavior, etc.), presents multi-select for user control, deep-dives each area with focused questioning
- Explicit scope guardrail prevents scope creep during discussion — captures deferred ideas without acting on them
- CONTEXT.md template restructured for decisions (domain boundary, decisions by category, Claude's discretion, deferred ideas)
- Downstream awareness: discuss-phase now explicitly documents that CONTEXT.md feeds researcher and planner agents
- `/gsdt:plan-phase` now integrates research — spawns `gsdt-phase-researcher` before planning unless research exists or `--skip-research` flag used

## [1.5.18] - 2026-01-16

### Added
- **Plan verification loop** — Plans are now verified before execution with a planner → checker → revise cycle
  - New `gsdt-plan-checker` agent (744 lines) validates plans will achieve phase goals
  - Six verification dimensions: requirement coverage, task completeness, dependency correctness, key links, scope sanity, must_haves derivation
  - Max 3 revision iterations before user escalation
  - `--skip-verify` flag for experienced users who want to bypass verification
- **Dedicated planner agent** — `gsdt-planner` (1,319 lines) consolidates all planning expertise
  - Complete methodology: discovery levels, task breakdown, dependency graphs, scope estimation, goal-backward analysis
  - Revision mode for handling checker feedback
  - TDD integration and checkpoint patterns
- **Statusline integration** — Context usage, model, and current task display

### Changed
- `/gsdt:plan-phase` refactored to thin orchestrator pattern (310 lines)
  - Spawns `gsdt-planner` for planning, `gsdt-plan-checker` for verification
  - User sees status between agent spawns (not a black box)
- Planning references deprecated with redirects to `gsdt-planner` agent sections
  - `plan-format.md`, `scope-estimation.md`, `goal-backward.md`, `principles.md`
  - `workflows/plan-phase.md`

### Fixed
- Removed zombie `gsd-milestone-auditor` agent (was accidentally re-added after correct deletion)

### Removed
- Phase 99 throwaway test files

## [1.5.17] - 2026-01-15

### Added
- New `/gsdt:update` command — check for updates, install, and display changelog of what changed (better UX than raw `npx gsdt`)

## [1.5.16] - 2026-01-15

### Added
- New `gsdt-phase-researcher` agent (915 lines) with comprehensive research methodology, 4 research modes (ecosystem, feasibility, implementation, comparison), source hierarchy, and verification protocols
- New `gsdt-debugger` agent (990 lines) with scientific debugging methodology, hypothesis testing, and 7+ investigation techniques
- New `gsdt-codebase-mapper` agent for brownfield codebase analysis
- Research subagent prompt template for context-only spawning

### Changed
- `/gsdt:research-phase` refactored to thin orchestrator — now injects rich context (key insight framing, downstream consumer info, quality gates) to gsdt-phase-researcher agent
- `/gsdt:research-project` refactored to spawn 4 parallel gsdt-phase-researcher agents with milestone-aware context (greenfield vs v1.1+) and roadmap implications guidance
- `/gsdt:debug` refactored to thin orchestrator (149 lines) — spawns gsdt-debugger agent with full debugging expertise
- `/gsdt:new-milestone` now explicitly references MILESTONE-CONTEXT.md

### Deprecated
- `workflows/research-phase.md` — consolidated into gsdt-phase-researcher agent
- `workflows/research-project.md` — consolidated into gsdt-phase-researcher agent
- `workflows/debug.md` — consolidated into gsdt-debugger agent
- `references/research-pitfalls.md` — consolidated into gsdt-phase-researcher agent
- `references/debugging.md` — consolidated into gsdt-debugger agent
- `references/debug-investigation.md` — consolidated into gsdt-debugger agent

## [1.5.15] - 2025-01-15

### Fixed
- **Agents now install correctly** — The `agents/` folder (gsdt-executor, gsdt-verifier, gsdt-integration-checker, gsd-milestone-auditor) was missing from npm package, now included

### Changed
- Consolidated `/gsdt:plan-fix` into `/gsdt:plan-phase --gaps` for simpler workflow
- UAT file writes now batched instead of per-response for better performance

## [1.5.14] - 2025-01-15

### Fixed
- Plan-phase now always routes to `/gsdt:execute-phase` after planning, even for single-plan phases

## [1.5.13] - 2026-01-15

### Fixed
- `/gsdt:new-milestone` now presents research and requirements paths as equal options, matching `/gsdt:new-project` format

## [1.5.12] - 2025-01-15

### Changed
- **Milestone cycle reworked for proper requirements flow:**
  - `complete-milestone` now archives AND deletes ROADMAP.md and REQUIREMENTS.md (fresh for next milestone)
  - `new-milestone` is now a "brownfield new-project" — updates PROJECT.md with new goals, routes to define-requirements
  - `discuss-milestone` is now required before `new-milestone` (creates context file)
  - `research-project` is milestone-aware — focuses on new features, ignores already-validated requirements
  - `create-roadmap` continues phase numbering from previous milestone
  - Flow: complete → discuss → new-milestone → research → requirements → roadmap

### Fixed
- `MILESTONE-AUDIT.md` now versioned as `v{version}-MILESTONE-AUDIT.md` and archived on completion
- `progress` now correctly routes to `/gsdt:discuss-milestone` when between milestones (Route F)

## [1.5.11] - 2025-01-15

### Changed
- Verifier reuses previous must-haves on re-verification instead of re-deriving, focuses deep verification on failed items with quick regression checks on passed items

## [1.5.10] - 2025-01-15

### Changed
- Milestone audit now reads existing phase VERIFICATION.md files instead of re-verifying each phase, aggregates tech debt and deferred gaps, adds `tech_debt` status for non-blocking accumulated debt

### Fixed
- VERIFICATION.md now included in phase completion commit alongside ROADMAP.md, STATE.md, and REQUIREMENTS.md

## [1.5.9] - 2025-01-15

### Added
- Milestone audit system (`/gsdt:audit-milestone`) for verifying milestone completion with parallel verification agents

### Changed
- Checkpoint display format improved with box headers and unmissable "→ YOUR ACTION:" prompts
- Subagent colors updated (executor: yellow, integration-checker: blue)
- Execute-phase now recommends `/gsdt:audit-milestone` when milestone completes

### Fixed
- Research-phase no longer gatekeeps by domain type

### Removed
- Domain expertise feature (`~/.claude/skills/expertise/`) - was personal tooling not available to other users

## [1.5.8] - 2025-01-15

### Added
- Verification loop: When gaps are found, verifier generates fix plans that execute automatically before re-verifying

### Changed
- `gsdt-executor` subagent color changed from red to blue

## [1.5.7] - 2025-01-15

### Added
- `gsdt-executor` subagent: Dedicated agent for plan execution with full workflow logic built-in
- `gsdt-verifier` subagent: Goal-backward verification that checks if phase goals are actually achieved (not just tasks completed)
- Phase verification: Automatic verification runs when a phase completes to catch stubs and incomplete implementations
- Goal-backward planning reference: Documentation for deriving must-haves from goals

### Changed
- execute-plan and execute-phase now spawn `gsdt-executor` subagent instead of using inline workflow
- Roadmap and planning workflows enhanced with goal-backward analysis

### Removed
- Obsolete templates (`checkpoint-resume.md`, `subagent-task-prompt.md`) — logic now lives in subagents

### Fixed
- Updated remaining `general-purpose` subagent references to use `gsdt-executor`

## [1.5.6] - 2025-01-15

### Changed
- README: Separated flow into distinct steps (1 → 1.5 → 2 → 3 → 4 → 5) making `research-project` clearly optional and `define-requirements` required
- README: Research recommended for quality; skip only for speed

### Fixed
- execute-phase: Phase metadata (timing, wave info) now bundled into single commit instead of separate commits

## [1.5.5] - 2025-01-15

### Changed
- README now documents the `research-project` → `define-requirements` flow (optional but recommended before `create-roadmap`)
- Commands section reorganized into 7 grouped tables (Setup, Execution, Verification, Milestones, Phase Management, Session, Utilities) for easier scanning
- Context Engineering table now includes `research/` and `REQUIREMENTS.md`

## [1.5.4] - 2025-01-15

### Changed
- Research phase now loads REQUIREMENTS.md to focus research on concrete requirements (e.g., "email verification") rather than just high-level roadmap descriptions

## [1.5.3] - 2025-01-15

### Changed
- **execute-phase narration**: Orchestrator now describes what each wave builds before spawning agents, and summarizes what was built after completion. No more staring at opaque status updates.
- **new-project flow**: Now offers two paths — research first (recommended) or define requirements directly (fast path for familiar domains)
- **define-requirements**: Works without prior research. Gathers requirements through conversation when FEATURES.md doesn't exist.

### Removed
- Dead `/gsdt:status` command (referenced abandoned background agent model)
- Unused `agent-history.md` template
- `_archive/` directory with old execute-phase version

## [1.5.2] - 2026-01-15

### Added
- Requirements traceability: roadmap phases now include `Requirements:` field listing which REQ-IDs they cover
- plan-phase loads REQUIREMENTS.md and shows phase-specific requirements before planning
- Requirements automatically marked Complete when phase finishes

### Changed
- Workflow preferences (mode, depth, parallelization) now asked in single prompt instead of 3 separate questions
- define-requirements shows full requirements list inline before commit (not just counts)
- Research-project and workflow aligned to both point to define-requirements as next step

### Fixed
- Requirements status now updated by orchestrator (commands) instead of subagent workflow, which couldn't determine phase completion

## [1.5.1] - 2026-01-14

### Changed
- Research agents write their own files directly (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md) instead of returning results to orchestrator
- Slimmed principles.md and load it dynamically in core commands

## [1.5.0] - 2026-01-14

### Added
- New `/gsdt:research-project` command for pre-roadmap ecosystem research — spawns parallel agents to investigate stack, features, architecture, and pitfalls before you commit to a roadmap
- New `/gsdt:define-requirements` command for scoping v1 requirements from research findings — transforms "what exists in this domain" into "what we're building"
- Requirements traceability: phases now map to specific requirement IDs with 100% coverage validation

### Changed
- **BREAKING:** New project flow is now: `new-project → research-project → define-requirements → create-roadmap`
- Roadmap creation now requires REQUIREMENTS.md and validates all v1 requirements are mapped to phases
- Simplified questioning in new-project to four essentials (vision, core priority, boundaries, constraints)

## [1.4.29] - 2026-01-14

### Removed
- Deleted obsolete `_archive/execute-phase.md` and `status.md` commands

## [1.4.28] - 2026-01-14

### Fixed
- Restored comprehensive checkpoint documentation with full examples for verification, decisions, and auth gates
- Fixed execute-plan command to use fresh continuation agents instead of broken resume pattern
- Rich checkpoint presentation formats now documented for all three checkpoint types

### Changed
- Slimmed execute-phase command to properly delegate checkpoint handling to workflow

## [1.4.27] - 2025-01-14

### Fixed
- Restored "what to do next" commands after plan/phase execution completes — orchestrator pattern conversion had inadvertently removed the copy/paste-ready next-step routing

## [1.4.26] - 2026-01-14

### Added
- Full changelog history backfilled from git (66 historical versions from 1.0.0 to 1.4.23)

## [1.4.25] - 2026-01-14

### Added
- New `/gsdt:whats-new` command shows changes since your installed version
- VERSION file written during installation for version tracking
- CHANGELOG.md now included in package installation

## [1.4.24] - 2026-01-14

### Added
- USER-SETUP.md template for external service configuration

### Removed
- **BREAKING:** ISSUES.md system (replaced by phase-scoped UAT issues and TODOs)

## [1.4.23] - 2026-01-14

### Changed
- Removed dead ISSUES.md system code

## [1.4.22] - 2026-01-14

### Added
- Subagent isolation for debug investigations with checkpoint support

### Fixed
- DEBUG_DIR path constant to prevent typos in debug workflow

## [1.4.21] - 2026-01-14

### Fixed
- SlashCommand tool added to plan-fix allowed-tools

## [1.4.20] - 2026-01-14

### Fixed
- Standardized debug file naming convention
- Debug workflow now invokes execute-plan correctly

## [1.4.19] - 2026-01-14

### Fixed
- Auto-diagnose issues instead of offering choice in plan-fix

## [1.4.18] - 2026-01-14

### Added
- Parallel diagnosis before plan-fix execution

## [1.4.17] - 2026-01-14

### Changed
- Redesigned verify-work as conversational UAT with persistent state

## [1.4.16] - 2026-01-13

### Added
- Pre-execution summary for interactive mode in execute-plan
- Pre-computed wave numbers at plan time

## [1.4.15] - 2026-01-13

### Added
- Context rot explanation to README header

## [1.4.14] - 2026-01-13

### Changed
- YOLO mode is now recommended default in new-project

## [1.4.13] - 2026-01-13

### Fixed
- Brownfield flow documentation
- Removed deprecated resume-task references

## [1.4.12] - 2026-01-13

### Changed
- execute-phase is now recommended as primary execution command

## [1.4.11] - 2026-01-13

### Fixed
- Checkpoints now use fresh continuation agents instead of resume

## [1.4.10] - 2026-01-13

### Changed
- execute-plan converted to orchestrator pattern for performance

## [1.4.9] - 2026-01-13

### Changed
- Removed subagent-only context from execute-phase orchestrator

### Fixed
- Removed "what's out of scope" question from discuss-phase

## [1.4.8] - 2026-01-13

### Added
- TDD reasoning explanation restored to plan-phase docs

## [1.4.7] - 2026-01-13

### Added
- Project state loading before execution in execute-phase

### Fixed
- Parallel execution marked as recommended, not experimental

## [1.4.6] - 2026-01-13

### Added
- Checkpoint pause/resume for spawned agents
- Deviation rules, commit rules, and workflow references to execute-phase

## [1.4.5] - 2026-01-13

### Added
- Parallel-first planning with dependency graphs
- Checkpoint-resume capability for long-running phases
- `.claude/rules/` directory for auto-loaded contribution rules

### Changed
- execute-phase uses wave-based blocking execution

## [1.4.4] - 2026-01-13

### Fixed
- Inline listing for multiple active debug sessions

## [1.4.3] - 2026-01-13

### Added
- `/gsdt:debug` command for systematic debugging with persistent state

## [1.4.2] - 2026-01-13

### Fixed
- Installation verification step clarification

## [1.4.1] - 2026-01-13

### Added
- Parallel phase execution via `/gsdt:execute-phase`
- Parallel-aware planning in `/gsdt:plan-phase`
- `/gsdt:status` command for parallel agent monitoring
- Parallelization configuration in config.json
- Wave-based parallel execution with dependency graphs

### Changed
- Renamed `execute-phase.md` workflow to `execute-plan.md` for clarity
- Plan frontmatter now includes `wave`, `depends_on`, `files_modified`, `autonomous`

## [1.4.0] - 2026-01-12

### Added
- Full parallel phase execution system
- Parallelization frontmatter in plan templates
- Dependency analysis for parallel task scheduling
- Agent history schema v1.2 with parallel execution support

### Changed
- Plans can now specify wave numbers and dependencies
- execute-phase orchestrates multiple subagents in waves

## [1.3.34] - 2026-01-11

### Added
- `/gsdt:add-todo` and `/gsdt:check-todos` for mid-session idea capture

## [1.3.33] - 2026-01-11

### Fixed
- Consistent zero-padding for decimal phase numbers (e.g., 01.1)

### Changed
- Removed obsolete .claude-plugin directory

## [1.3.32] - 2026-01-10

### Added
- `/gsdt:resume-task` for resuming interrupted subagent executions

## [1.3.31] - 2026-01-08

### Added
- Planning principles for security, performance, and observability
- Pro patterns section in README

## [1.3.30] - 2026-01-08

### Added
- verify-work option surfaces after plan execution

## [1.3.29] - 2026-01-08

### Added
- `/gsdt:verify-work` for conversational UAT validation
- `/gsdt:plan-fix` for fixing UAT issues
- UAT issues template

## [1.3.28] - 2026-01-07

### Added
- `--config-dir` CLI argument for multi-account setups
- `/gsdt:remove-phase` command

### Fixed
- Validation for --config-dir edge cases

## [1.3.27] - 2026-01-07

### Added
- Recommended permissions mode documentation

### Fixed
- Mandatory verification enforced before phase/milestone completion routing

## [1.3.26] - 2026-01-06

### Added
- Claude Code marketplace plugin support

### Fixed
- Phase artifacts now committed when created

## [1.3.25] - 2026-01-06

### Fixed
- Milestone discussion context persists across /clear

## [1.3.24] - 2026-01-06

### Added
- `CLAUDE_CONFIG_DIR` environment variable support

## [1.3.23] - 2026-01-06

### Added
- Non-interactive install flags (`--global`, `--local`) for Docker/CI

## [1.3.22] - 2026-01-05

### Changed
- Removed unused auto.md command

## [1.3.21] - 2026-01-05

### Changed
- TDD features use dedicated plans for full context quality

## [1.3.20] - 2026-01-05

### Added
- Per-task atomic commits for better AI observability

## [1.3.19] - 2026-01-05

### Fixed
- Clarified create-milestone.md file locations with explicit instructions

## [1.3.18] - 2026-01-05

### Added
- YAML frontmatter schema with dependency graph metadata
- Intelligent context assembly via frontmatter dependency graph

## [1.3.17] - 2026-01-04

### Fixed
- Clarified depth controls compression, not inflation in planning

## [1.3.16] - 2026-01-04

### Added
- Depth parameter for planning thoroughness (`--depth=1-5`)

## [1.3.15] - 2026-01-01

### Fixed
- TDD reference loaded directly in commands

## [1.3.14] - 2025-12-31

### Added
- TDD integration with detection, annotation, and execution flow

## [1.3.13] - 2025-12-29

### Fixed
- Restored deterministic bash commands
- Removed redundant decision_gate

## [1.3.12] - 2025-12-29

### Fixed
- Restored plan-format.md as output template

## [1.3.11] - 2025-12-29

### Changed
- 70% context reduction for plan-phase workflow
- Merged CLI automation into checkpoints
- Compressed scope-estimation (74% reduction) and plan-phase.md (66% reduction)

## [1.3.10] - 2025-12-29

### Fixed
- Explicit plan count check in offer_next step

## [1.3.9] - 2025-12-27

### Added
- Evolutionary PROJECT.md system with incremental updates

## [1.3.8] - 2025-12-18

### Added
- Brownfield/existing projects section in README

## [1.3.7] - 2025-12-18

### Fixed
- Improved incremental codebase map updates

## [1.3.6] - 2025-12-18

### Added
- File paths included in codebase mapping output

## [1.3.5] - 2025-12-17

### Fixed
- Removed arbitrary 100-line limit from codebase mapping

## [1.3.4] - 2025-12-17

### Fixed
- Inline code for Next Up commands (avoids nesting ambiguity)

## [1.3.3] - 2025-12-17

### Fixed
- Check PROJECT.md not .gsdt-planning/ directory for existing project detection

## [1.3.2] - 2025-12-17

### Added
- Git commit step to map-codebase workflow

## [1.3.1] - 2025-12-17

### Added
- `/gsdt:map-codebase` documentation in help and README

## [1.3.0] - 2025-12-17

### Added
- `/gsdt:map-codebase` command for brownfield project analysis
- Codebase map templates (stack, architecture, structure, conventions, testing, integrations, concerns)
- Parallel Explore agent orchestration for codebase analysis
- Brownfield integration into GSD workflows

### Changed
- Improved continuation UI with context and visual hierarchy

### Fixed
- Permission errors for non-DSP users (removed shell context)
- First question is now freeform, not AskUserQuestion

## [1.2.13] - 2025-12-17

### Added
- Improved continuation UI with context and visual hierarchy

## [1.2.12] - 2025-12-17

### Fixed
- First question should be freeform, not AskUserQuestion

## [1.2.11] - 2025-12-17

### Fixed
- Permission errors for non-DSP users (removed shell context)

## [1.2.10] - 2025-12-16

### Fixed
- Inline command invocation replaced with clear-then-paste pattern

## [1.2.9] - 2025-12-16

### Fixed
- Git init runs in current directory

## [1.2.8] - 2025-12-16

### Changed
- Phase count derived from work scope, not arbitrary limits

## [1.2.7] - 2025-12-16

### Fixed
- AskUserQuestion mandated for all exploration questions

## [1.2.6] - 2025-12-16

### Changed
- Internal refactoring

## [1.2.5] - 2025-12-16

### Changed
- `<if mode>` tags for yolo/interactive branching

## [1.2.4] - 2025-12-16

### Fixed
- Stale CONTEXT.md references updated to new vision structure

## [1.2.3] - 2025-12-16

### Fixed
- Enterprise language removed from help and discuss-milestone

## [1.2.2] - 2025-12-16

### Fixed
- new-project completion presented inline instead of as question

## [1.2.1] - 2025-12-16

### Fixed
- AskUserQuestion restored for decision gate in questioning flow

## [1.2.0] - 2025-12-15

### Changed
- Research workflow implemented as Claude Code context injection

## [1.1.2] - 2025-12-15

### Fixed
- YOLO mode now skips confirmation gates in plan-phase

## [1.1.1] - 2025-12-15

### Added
- README documentation for new research workflow

## [1.1.0] - 2025-12-15

### Added
- Pre-roadmap research workflow
- `/gsdt:research-phase` for niche domain ecosystem discovery
- `/gsdt:research-project` command with workflow and templates
- `/gsdt:create-roadmap` command with research-aware workflow
- Research subagent prompt templates

### Changed
- new-project split to only create PROJECT.md + config.json
- Questioning rewritten as thinking partner, not interviewer

## [1.0.11] - 2025-12-15

### Added
- `/gsdt:research-phase` for niche domain ecosystem discovery

## [1.0.10] - 2025-12-15

### Fixed
- Scope creep prevention in discuss-phase command

## [1.0.9] - 2025-12-15

### Added
- Phase CONTEXT.md loaded in plan-phase command

## [1.0.8] - 2025-12-15

### Changed
- PLAN.md included in phase completion commits

## [1.0.7] - 2025-12-15

### Added
- Path replacement for local installs

## [1.0.6] - 2025-12-15

### Changed
- Internal improvements

## [1.0.5] - 2025-12-15

### Added
- Global/local install prompt during setup

### Fixed
- Bin path fixed (removed ./)
- .DS_Store ignored

## [1.0.4] - 2025-12-15

### Fixed
- Bin name and circular dependency removed

## [1.0.3] - 2025-12-15

### Added
- TDD guidance in planning workflow

## [1.0.2] - 2025-12-15

### Added
- Issue triage system to prevent deferred issue pile-up

## [1.0.1] - 2025-12-15

### Added
- Initial npm package release

## [1.0.0] - 2025-12-14

### Added
- Initial release of GSD (Get Shit Done) meta-prompting system
- Core slash commands: `/gsdt:new-project`, `/gsdt:discuss-phase`, `/gsdt:plan-phase`, `/gsdt:execute-phase`
- PROJECT.md and STATE.md templates
- Phase-based development workflow
- YOLO mode for autonomous execution
- Interactive mode with checkpoints

[Unreleased]: https://github.com/gsd-build/gsdt/compare/v1.30.0...HEAD
[1.30.0]: https://github.com/gsd-build/gsdt/releases/tag/v1.30.0
[1.29.0]: https://github.com/gsd-build/gsdt/releases/tag/v1.29.0
[1.28.0]: https://github.com/gsd-build/gsdt/releases/tag/v1.28.0
[1.27.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.27.0
[1.26.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.26.0
[1.25.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.25.0
[1.24.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.24.0
[1.23.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.23.0
[1.22.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.22.4
[1.22.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.22.3
[1.22.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.22.2
[1.22.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.22.1
[1.22.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.22.0
[1.21.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.21.1
[1.21.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.21.0
[1.20.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.6
[1.20.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.5
[1.20.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.4
[1.20.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.3
[1.20.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.2
[1.20.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.1
[1.20.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.20.0
[1.19.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.19.2
[1.19.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.19.1
[1.19.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.19.0
[1.18.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.18.0
[1.17.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.17.0
[1.16.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.16.0
[1.15.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.15.0
[1.14.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.14.0
[1.13.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.13.0
[1.12.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.12.1
[1.12.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.12.0
[1.11.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.11.2
[1.11.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.11.0
[1.10.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.10.1
[1.10.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.10.0
[1.9.12]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.12
[1.9.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.11
[1.9.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.10
[1.9.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.9
[1.9.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.8
[1.9.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.7
[1.9.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.6
[1.9.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.5
[1.9.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.4
[1.9.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.2
[1.9.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.9.0
[1.8.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.8.0
[1.7.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.7.1
[1.7.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.7.0
[1.6.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.6.4
[1.6.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.6.3
[1.6.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.6.2
[1.6.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.6.1
[1.6.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.6.0
[1.5.30]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.30
[1.5.29]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.29
[1.5.28]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.28
[1.5.27]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.27
[1.5.26]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.26
[1.5.25]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.25
[1.5.24]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.24
[1.5.23]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.23
[1.5.22]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.22
[1.5.21]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.21
[1.5.20]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.20
[1.5.19]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.19
[1.5.18]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.18
[1.5.17]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.17
[1.5.16]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.16
[1.5.15]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.15
[1.5.14]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.14
[1.5.13]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.13
[1.5.12]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.12
[1.5.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.11
[1.5.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.10
[1.5.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.9
[1.5.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.8
[1.5.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.7
[1.5.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.6
[1.5.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.5
[1.5.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.4
[1.5.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.3
[1.5.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.2
[1.5.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.1
[1.5.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.5.0
[1.4.29]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.29
[1.4.28]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.28
[1.4.27]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.27
[1.4.26]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.26
[1.4.25]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.25
[1.4.24]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.24
[1.4.23]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.23
[1.4.22]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.22
[1.4.21]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.21
[1.4.20]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.20
[1.4.19]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.19
[1.4.18]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.18
[1.4.17]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.17
[1.4.16]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.16
[1.4.15]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.15
[1.4.14]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.14
[1.4.13]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.13
[1.4.12]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.12
[1.4.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.11
[1.4.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.10
[1.4.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.9
[1.4.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.8
[1.4.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.7
[1.4.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.6
[1.4.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.5
[1.4.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.4
[1.4.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.3
[1.4.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.2
[1.4.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.1
[1.4.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.4.0
[1.3.34]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.34
[1.3.33]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.33
[1.3.32]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.32
[1.3.31]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.31
[1.3.30]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.30
[1.3.29]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.29
[1.3.28]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.28
[1.3.27]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.27
[1.3.26]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.26
[1.3.25]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.25
[1.3.24]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.24
[1.3.23]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.23
[1.3.22]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.22
[1.3.21]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.21
[1.3.20]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.20
[1.3.19]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.19
[1.3.18]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.18
[1.3.17]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.17
[1.3.16]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.16
[1.3.15]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.15
[1.3.14]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.14
[1.3.13]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.13
[1.3.12]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.12
[1.3.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.11
[1.3.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.10
[1.3.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.9
[1.3.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.8
[1.3.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.7
[1.3.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.6
[1.3.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.5
[1.3.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.4
[1.3.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.3
[1.3.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.2
[1.3.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.1
[1.3.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.3.0
[1.2.13]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.13
[1.2.12]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.12
[1.2.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.11
[1.2.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.10
[1.2.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.9
[1.2.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.8
[1.2.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.7
[1.2.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.6
[1.2.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.5
[1.2.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.4
[1.2.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.3
[1.2.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.2
[1.2.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.1
[1.2.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.2.0
[1.1.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.1.2
[1.1.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.1.1
[1.1.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.1.0
[1.0.11]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.11
[1.0.10]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.10
[1.0.9]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.9
[1.0.8]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.8
[1.0.7]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.7
[1.0.6]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.6
[1.0.5]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.5
[1.0.4]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.4
[1.0.3]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.3
[1.0.2]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.2
[1.0.1]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.1
[1.0.0]: https://github.com/glittercowboy/gsdt/releases/tag/v1.0.0
