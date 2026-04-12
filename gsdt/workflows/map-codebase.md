<purpose>
Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .gsdt-planning/codebase/

Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.

Output: .gsdt-planning/codebase/ folder with 7 structured documents about the codebase state.
</purpose>

<available_agent_types>
Valid GSDT subagent types (use exact names — do not fall back to 'general-purpose'):
- gsdt-codebase-mapper — Maps project structure and dependencies
</available_agent_types>

<philosophy>
**Why dedicated mapper agents:**
- Fresh context per domain (no token contamination)
- Agents write documents directly (no context transfer back to orchestrator)
- Orchestrator only summarizes what was created (minimal context usage)
- Faster execution (agents run simultaneously)

**Document quality over length:**
Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.

**Always include file paths:**
Documents are reference material for Claude when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.
</philosophy>

<process>

<step name="init_context" priority="first">
Load codebase mapping context:

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" init map-codebase)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_MAPPER=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsdt-codebase-mapper 2>/dev/null)
```

Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`, `map_ignore`, `map_ignore_file_exists`.

Determine refresh mode from arguments:
- If `$ARGUMENTS` contains `--refresh`, set `FORCE_REFRESH=true`.
- Otherwise, set `FORCE_REFRESH=false`.
- Strip `--refresh` from any focus-area text before passing focus instructions to mapper agents.

Prepare a reusable mapper prompt block:

- If `map_ignore` contains entries, create:
  ```xml
  <map_ignore>
  Configured ignore patterns for broad exploration:
  - `dist`
  - `coverage/**`
  </map_ignore>
  ```
- If `map_ignore` is empty, create:
  ```xml
  <map_ignore>
  No additional configured ignore patterns.
  </map_ignore>
  ```

Pass `${MAP_IGNORE_BLOCK}` to every spawned mapper prompt and honor the same exclusions during sequential mapping.
</step>

<step name="check_existing">
Check if .gsdt-planning/codebase/ already exists using `has_maps` from init context.

If `codebase_dir_exists` is true:
```bash
ls -la .gsdt-planning/codebase/
```

**If `codebase_dir_exists` is true AND `$ARGUMENTS` contains `--refresh`:**

- Do not ask the user which refresh mode to use.
- Delete .gsdt-planning/codebase/, continue to create_structure.

```bash
rm -rf .gsdt-planning/codebase
```

**If exists:**

```
.gsdt-planning/codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh - Delete existing and remap codebase
2. Update - Keep existing, only update specific documents
3. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .gsdt-planning/codebase/, continue to create_structure
If "Update": Ask which documents to update, continue to spawn_agents (filtered)
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .gsdt-planning/codebase/ directory:

```bash
mkdir -p .gsdt-planning/codebase
```

**Expected output files:**
- STACK.md (from tech mapper)
- INTEGRATIONS.md (from tech mapper)
- ARCHITECTURE.md (from arch mapper)
- STRUCTURE.md (from arch mapper)
- CONVENTIONS.md (from quality mapper)
- TESTING.md (from quality mapper)
- CONCERNS.md (from concerns mapper)

Continue to spawn_agents.
</step>

<step name="detect_runtime_capabilities">
Before spawning agents, detect whether the current runtime supports the `Task` tool for subagent delegation.

**How to detect:** Check if you have access to a `Task` tool (may be capitalized as `Task` or lowercase as `task` depending on runtime). If you do NOT have a `Task`/`task` tool (or only have tools like `browser_subagent` which is for web browsing, NOT code analysis):

→ **Skip `spawn_agents` and `collect_confirmations`** — go directly to `sequential_mapping` instead.

**CRITICAL:** Never use `browser_subagent` or `Explore` as a substitute for `Task`. The `browser_subagent` tool is exclusively for web page interaction and will fail for codebase analysis. If `Task` is unavailable, perform the mapping sequentially in-context.
</step>

<step name="spawn_agents" condition="Task tool is available">
Spawn 4 parallel gsdt-codebase-mapper agents.

Use Task tool with `subagent_type="gsdt-codebase-mapper"`, `model="{mapper_model}"`, and `run_in_background=true` for parallel execution.

**CRITICAL:** Use the dedicated `gsdt-codebase-mapper` agent, NOT `Explore` or `browser_subagent`. The mapper agent writes documents directly.

**Agent 1: Tech Focus**

```
Task(
  subagent_type="gsdt-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase tech stack",
  prompt="Focus: tech

Analyze this codebase for technology stack and external integrations.

Write these documents to .gsdt-planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${MAP_IGNORE_BLOCK}
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 2: Architecture Focus**

```
Task(
  subagent_type="gsdt-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase architecture",
  prompt="Focus: arch

Analyze this codebase architecture and directory structure.

Write these documents to .gsdt-planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${MAP_IGNORE_BLOCK}
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 3: Quality Focus**

```
Task(
  subagent_type="gsdt-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase conventions",
  prompt="Focus: quality

Analyze this codebase for coding conventions and testing patterns.

Write these documents to .gsdt-planning/codebase/:
- CONVENTIONS.md - Code style, naming, patterns, error handling
- TESTING.md - Framework, structure, mocking, coverage

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${MAP_IGNORE_BLOCK}
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 4: Concerns Focus**

```
Task(
  subagent_type="gsdt-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase concerns",
  prompt="Focus: concerns

Analyze this codebase for technical debt, known issues, and areas of concern.

Write this document to .gsdt-planning/codebase/:
- CONCERNS.md - Tech debt, bugs, security, performance, fragile areas

Explore thoroughly. Write document directly using template. Return confirmation only.
${MAP_IGNORE_BLOCK}
${AGENT_SKILLS_MAPPER}"
)
```

Continue to collect_confirmations.
</step>

<step name="collect_confirmations">
Wait for all 4 agents to complete using TaskOutput tool.

**For each agent task_id returned by the Agent tool calls above:**
```
TaskOutput tool:
  task_id: "{task_id from Agent result}"
  block: true
  timeout: 300000
```

Call TaskOutput for all 4 agents in parallel (single message with 4 TaskOutput calls).

Once all TaskOutput calls return, read each agent's output file to collect confirmations.

**Expected confirmation format from each agent:**
```
## Mapping Complete

**Focus:** {focus}
**Documents written:**
- `.gsdt-planning/codebase/{DOC1}.md` ({N} lines)
- `.gsdt-planning/codebase/{DOC2}.md` ({N} lines)

Ready for orchestrator summary.
```

**What you receive:** Just file paths and line counts. NOT document contents.

If any agent failed, note the failure and continue with successful documents.

Continue to verify_output.
</step>

<step name="sequential_mapping" condition="Task tool is NOT available (e.g. Antigravity, Gemini CLI, Codex)">
When the `Task` tool is unavailable, perform codebase mapping sequentially in the current context. This replaces `spawn_agents` and `collect_confirmations`.

**IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool. Use only file system tools (Read, Bash, Write, Grep, Glob, list_dir, view_file, grep_search, or equivalent tools available in your runtime).

Perform all 4 mapping passes sequentially:

**Pass 1: Tech Focus**
- Explore package.json/Cargo.toml/go.mod/requirements.txt, config files, dependency trees
- Write `.gsdt-planning/codebase/STACK.md` — Languages, runtime, frameworks, dependencies, configuration
- Write `.gsdt-planning/codebase/INTEGRATIONS.md` — External APIs, databases, auth providers, webhooks

**Pass 2: Architecture Focus**
- Explore directory structure, entry points, module boundaries, data flow
- Write `.gsdt-planning/codebase/ARCHITECTURE.md` — Pattern, layers, data flow, abstractions, entry points
- Write `.gsdt-planning/codebase/STRUCTURE.md` — Directory layout, key locations, naming conventions

**Pass 3: Quality Focus**
- Explore code style, error handling patterns, test files, CI config
- Write `.gsdt-planning/codebase/CONVENTIONS.md` — Code style, naming, patterns, error handling
- Write `.gsdt-planning/codebase/TESTING.md` — Framework, structure, mocking, coverage

**Pass 4: Concerns Focus**
- Explore TODOs, known issues, fragile areas, security patterns
- Write `.gsdt-planning/codebase/CONCERNS.md` — Tech debt, bugs, security, performance, fragile areas

Use the same document templates as the `gsdt-codebase-mapper` agent. Include actual file paths formatted with backticks.

Honor the configured `${MAP_IGNORE_BLOCK}` rules during each sequential pass. Do not read or cite ignored paths unless the user explicitly asks about the ignore configuration itself.

Continue to verify_output.
</step>

<step name="verify_output">
Verify all documents created successfully:

```bash
ls -la .gsdt-planning/codebase/
wc -l .gsdt-planning/codebase/*.md
```

**Verification checklist:**
- All 7 documents exist
- No empty documents (each should have >20 lines)

If any documents missing or empty, note which agents may have failed.

Continue to scan_for_secrets.
</step>

<step name="scan_for_secrets">
**CRITICAL SECURITY CHECK:** Scan output files for accidentally leaked secrets before committing.

Run secret pattern detection:

```bash
# Check for common API key patterns in generated docs
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .gsdt-planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

**If SECRETS_FOUND=true:**

```
⚠️  SECURITY ALERT: Potential secrets detected in codebase documents!

Found patterns that look like API keys or tokens in:
[show grep output]

This would expose credentials if committed.

**Action required:**
1. Review the flagged content above
2. If these are real secrets, they must be removed before committing
3. Consider adding sensitive files to Claude Code "Deny" permissions

Pausing before commit. Reply "safe to proceed" if the flagged content is not actually sensitive, or edit the files first.
```

Wait for user confirmation before continuing to commit_codebase_map.

**If SECRETS_FOUND=false:**

Continue to commit_codebase_map.
</step>

<step name="commit_codebase_map">
Commit the codebase map:

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" commit "docs: map existing codebase" --files .gsdt-planning/codebase/*.md
```

Continue to offer_next.
</step>

<step name="offer_next">
Present completion summary and next steps.

**Get line counts:**
```bash
wc -l .gsdt-planning/codebase/*.md
```

**Output format:**

```
Codebase mapping complete.

Created .gsdt-planning/codebase/:
- STACK.md ([N] lines) - Technologies and dependencies
- ARCHITECTURE.md ([N] lines) - System design and patterns
- STRUCTURE.md ([N] lines) - Directory layout and organization
- CONVENTIONS.md ([N] lines) - Code style and patterns
- TESTING.md ([N] lines) - Test structure and practices
- INTEGRATIONS.md ([N] lines) - External services and APIs
- CONCERNS.md ([N] lines) - Technical debt and issues


---

## ▶ Next Up

**Initialize project** — use codebase context for planning

`/gsdt:new-project`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- Re-run mapping: `/gsdt:map-codebase`
- Review specific file: `cat .gsdt-planning/codebase/STACK.md`
- Edit any document before proceeding

---
```

End workflow.
</step>

</process>

<success_criteria>
- .gsdt-planning/codebase/ directory created
- If Task tool available: 4 parallel gsdt-codebase-mapper agents spawned with run_in_background=true
- If Task tool NOT available: 4 sequential mapping passes performed inline (never using browser_subagent)
- All 7 codebase documents exist
- No empty documents (each should have >20 lines)
- Clear completion summary with line counts
- User offered clear next steps in GSDT style
</success_criteria>
