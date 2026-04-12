---
name: gsdt:map-codebase
description: Analyze codebase with parallel mapper agents to produce .gsdt-planning/codebase/ documents
argument-hint: "[--refresh] [optional: specific area to map, e.g., 'api' or 'auth']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Analyze existing codebase using parallel gsdt-codebase-mapper agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.gsdt-planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .gsdt-planning/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
@~/.claude/gsdt/workflows/map-codebase.md
</execution_context>

<context>
Focus area: $ARGUMENTS (optional - if provided, tells agents to focus on specific subsystem)

Flags:
- `--refresh` — force a full remap of `.gsdt-planning/codebase/` without asking whether to refresh, update, or skip

Ignore controls:
- `planning.map_ignore` — repo-relative paths or glob-like patterns to exclude from broad mapping
- `.gsdt-mapignore` — optional line-based ignore file (comments start with `#`)
- Both sources are merged before mapper agents start

**Load project state if exists:**
Check for .gsdt-planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before /gsdt:new-project (brownfield codebases) - creates codebase map first
- After /gsdt:new-project (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization (understand existing code first)
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase
- Before major refactoring (understand current state)
- When STATE.md references outdated codebase info
- Repos with generated or vendored directories you want excluded from analysis

**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>

<process>
1. Check if .gsdt-planning/codebase/ already exists (`--refresh` forces a full remap without prompting)
2. Create .gsdt-planning/codebase/ directory structure
3. Spawn 4 parallel gsdt-codebase-mapper agents:
   - Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
   - Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
   - Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
   - Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: /gsdt:new-project or /gsdt:plan-phase)
</process>

<success_criteria>
- [ ] .gsdt-planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>
