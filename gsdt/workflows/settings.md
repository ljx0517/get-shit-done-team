<purpose>
Interactive configuration of GSDT core strategy defaults (mode, granularity, parallelization, commit_docs), workflow agents/toggles, git branching, and model profile via multi-question prompt. Updates .gsdt-planning/config.json with user preferences. Optionally saves settings as global defaults (~/.gsdt/defaults.json) for future projects.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="ensure_and_load_config">
Ensure config exists and load current state:

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" config-ensure-section
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" state load)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Creates `.gsdt-planning/config.json` with defaults if missing and loads current config values.
</step>

<step name="read_current">
```bash
cat .gsdt-planning/config.json
```

Parse current values:
- `mode` — overall interaction mode for config-aware workflows (default: `yolo`)
- `granularity` — roadmap slicing depth (default: `fine`)
- `parallelization` — whether independent plans run simultaneously (default: `true`)
- `commit_docs` — whether planning docs stay tracked in git (default: `true` unless `.gsdt-planning/` is gitignored)
- `workflow.research` — spawn researcher during plan-phase
- `workflow.plan_check` — spawn plan checker during plan-phase
- `workflow.verifier` — spawn verifier during execute-phase
- `workflow.nyquist_validation` — validation architecture research during plan-phase (default: true if absent)
- `workflow.ui_phase` — generate UI-SPEC.md design contracts for frontend phases (default: true if absent)
- `workflow.ui_safety_gate` — prompt to run /gsdt:ui-phase before planning frontend phases (default: true if absent)
- `model_profile` — which model each agent uses (default: `quality`)
- `git.branching_strategy` — branching approach (default: `"none"`)
</step>

<step name="present_settings">
Use AskUserQuestion with current values pre-selected:

```
AskUserQuestion([
  {
    question: "How do you want to work?",
    header: "Mode",
    multiSelect: false,
    options: [
      { label: "YOLO (Recommended)", description: "Auto-approve, just execute" },
      { label: "Interactive", description: "Confirm at each step" }
    ]
  },
  {
    question: "How finely should scope be sliced into phases?",
    header: "Granularity",
    multiSelect: false,
    options: [
      { label: "Coarse", description: "Fewer, broader phases (3-5 phases, 1-3 plans each)" },
      { label: "Standard", description: "Balanced phase size (5-8 phases, 3-5 plans each)" },
      { label: "Fine (Recommended)", description: "Many focused phases (8-12 phases, 5-10 plans each)" }
    ]
  },
  {
    question: "Run plans in parallel?",
    header: "Execution",
    multiSelect: false,
    options: [
      { label: "Parallel (Recommended)", description: "Independent plans run simultaneously" },
      { label: "Sequential", description: "One plan at a time" }
    ]
  },
  {
    question: "Commit planning docs to git?",
    header: "Git Tracking",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Planning docs tracked in version control" },
      { label: "No", description: "Keep .gsdt-planning/ local-only (add to .gitignore)" }
    ]
  },
  {
    question: "Which model profile for agents?",
    header: "Model",
    multiSelect: false,
    options: [
      { label: "Quality", description: "Opus everywhere except verification (highest cost)" },
      { label: "Balanced (Recommended)", description: "Opus for planning, Sonnet for research/execution/verification" },
      { label: "Budget", description: "Sonnet for writing, Haiku for research/verification (lowest cost)" },
      { label: "Inherit", description: "Use current session model for all agents (best for OpenRouter, local models, or runtime model switching)" }
    ]
  },
  {
    question: "Spawn Plan Researcher? (researches domain before planning)",
    header: "Research",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Research phase goals before planning" },
      { label: "No", description: "Skip research, plan directly" }
    ]
  },
  {
    question: "Spawn Plan Checker? (verifies plans before execution)",
    header: "Plan Check",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify plans meet phase goals" },
      { label: "No", description: "Skip plan verification" }
    ]
  },
  {
    question: "Spawn Execution Verifier? (verifies phase completion)",
    header: "Verifier",
    multiSelect: false,
    options: [
      { label: "Yes", description: "Verify must-haves after execution" },
      { label: "No", description: "Skip post-execution verification" }
    ]
  },
  {
    question: "Auto-advance pipeline? (discuss → plan → execute automatically)",
    header: "Auto",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Manual /clear + paste between stages" },
      { label: "Yes", description: "Chain stages via Task() subagents (same isolation)" }
    ]
  },
  {
    question: "Enable Nyquist Validation? (researches test coverage during planning)",
    header: "Nyquist",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Research automated test coverage during plan-phase. Adds validation requirements to plans. Blocks approval if tasks lack automated verify." },
      { label: "No", description: "Skip validation research. Good for rapid prototyping or no-test phases." }
    ]
  },
  // Note: Nyquist validation depends on research output. If research is disabled,
  // plan-phase automatically skips Nyquist steps (no RESEARCH.md to extract from).
  {
    question: "Enable UI Phase? (generates UI-SPEC.md design contracts for frontend phases)",
    header: "UI Phase",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Generate UI design contracts before planning frontend phases. Locks spacing, typography, color, and copywriting." },
      { label: "No", description: "Skip UI-SPEC generation. Good for backend-only projects or API phases." }
    ]
  },
  {
    question: "Enable UI Safety Gate? (prompts to run /gsdt:ui-phase before planning frontend phases)",
    header: "UI Gate",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "plan-phase asks to run /gsdt:ui-phase first when frontend indicators detected." },
      { label: "No", description: "No prompt — plan-phase proceeds without UI-SPEC check." }
    ]
  },
  {
    question: "Git branching strategy?",
    header: "Branching",
    multiSelect: false,
    options: [
      { label: "None (Recommended)", description: "Commit directly to current branch" },
      { label: "Per Phase", description: "Create branch for each phase (gsdt/phase-{N}-{name})" },
      { label: "Per Milestone", description: "Create branch for entire milestone (gsdt/{version}-{name})" }
    ]
  },
  {
    question: "Enable context window warnings? (injects advisory messages when context is getting full)",
    header: "Ctx Warnings",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "Warn when context usage exceeds 65%. Helps avoid losing work." },
      { label: "No", description: "Disable warnings. Allows Claude to reach auto-compact naturally. Good for long unattended runs." }
    ]
  },
  {
    question: "Research best practices before asking questions? (web search during new-project and discuss-phase)",
    header: "Research Qs",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Ask questions directly. Faster, uses fewer tokens." },
      { label: "Yes", description: "Search web for best practices before each question group. More informed questions but uses more tokens." }
    ]
  },
  {
    question: "Discussion style for /gsdt:discuss-phase?",
    header: "Discuss Mode",
    multiSelect: false,
    options: [
      { label: "Discuss (Recommended)", description: "Ask open-ended questions one by one" },
      { label: "Assumptions", description: "Read the codebase first, surface assumptions, and ask only for corrections" }
    ]
  },
  {
    question: "Skip discuss-phase in autonomous mode? (use ROADMAP phase goals as spec)",
    header: "Skip Discuss",
    multiSelect: false,
    options: [
      { label: "No (Recommended)", description: "Run smart discuss before each phase — surfaces gray areas and captures decisions." },
      { label: "Yes", description: "Skip discuss in /gsdt:autonomous — chain directly to plan. Best for backend/pipeline work where phase descriptions are the spec." }
    ]
  }
])
```
</step>

<step name="update_config">
Merge new settings into existing config.json:

```json
{
  ...existing_config,
  "mode": "yolo" | "interactive",
  "granularity": "coarse" | "standard" | "fine",
  "parallelization": true/false,
  "commit_docs": true/false,
  "model_profile": "quality" | "balanced" | "budget" | "inherit",
  "workflow": {
    "research": true/false,
    "plan_check": true/false,
    "verifier": true/false,
    "auto_advance": true/false,
    "nyquist_validation": true/false,
    "ui_phase": true/false,
    "ui_safety_gate": true/false,
    "research_before_questions": true/false,
    "discuss_mode": "discuss" | "assumptions",
    "skip_discuss": true/false
  },
  "git": {
    "branching_strategy": "none" | "phase" | "milestone"
  },
  "hooks": {
    "context_warnings": true/false
  }
}
```

Write updated config to `.gsdt-planning/config.json`.
</step>

<step name="save_as_defaults">
Ask whether to save these settings as global defaults for future projects:

```
AskUserQuestion([
  {
    question: "Save these as default settings for all new projects?",
    header: "Defaults",
    multiSelect: false,
    options: [
      { label: "Yes", description: "New projects start with these settings (saved to ~/.gsdt/defaults.json)" },
      { label: "No", description: "Only apply to this project" }
    ]
  }
])
```

If "Yes": write the same config object (minus project-specific fields like `brave_search`) to `~/.gsdt/defaults.json`:

```bash
mkdir -p ~/.gsd
```

Write `~/.gsdt/defaults.json` with:
```json
{
  "mode": <current>,
  "granularity": <current>,
  "model_profile": <current>,
  "commit_docs": <current>,
  "parallelization": <current>,
  "branching_strategy": <current>,
  "quick_branch_template": <current>,
  "workflow": {
    "research": <current>,
    "plan_check": <current>,
    "verifier": <current>,
    "auto_advance": <current>,
    "nyquist_validation": <current>,
    "ui_phase": <current>,
    "ui_safety_gate": <current>,
    "research_before_questions": <current>,
    "discuss_mode": <current>,
    "skip_discuss": <current>
  },
  "hooks": {
    "context_warnings": <current>
  }
}
```
</step>

<step name="confirm">
Display:

```
── GSDT ► SETTINGS UPDATED ──

| Setting              | Value |
|----------------------|-------|
| Mode                 | {yolo/interactive} |
| Granularity          | {coarse/standard/fine} |
| Parallel Plans       | {On/Off} |
| Planning Docs in Git | {On/Off} |
| Model Profile        | {quality/balanced/budget/inherit} |
| Plan Researcher      | {On/Off} |
| Plan Checker         | {On/Off} |
| Execution Verifier   | {On/Off} |
| Auto-Advance         | {On/Off} |
| Nyquist Validation   | {On/Off} |
| UI Phase             | {On/Off} |
| UI Safety Gate       | {On/Off} |
| Git Branching        | {None/Per Phase/Per Milestone} |
| Research Before Qs   | {On/Off} |
| Discuss Mode         | {discuss/assumptions} |
| Skip Discuss         | {On/Off} |
| Context Warnings     | {On/Off} |
| Saved as Defaults    | {Yes/No} |

These settings apply to future config-aware workflows, including /gsdt:new-project defaults, /gsdt:plan-phase, and /gsdt:execute-phase.

Quick commands:
- /gsdt:set-profile <profile> — switch model profile
- /gsdt:plan-phase --research — force research
- /gsdt:plan-phase --skip-research — skip research
- /gsdt:plan-phase --skip-verify — skip plan check
```
</step>

</process>

<success_criteria>
- [ ] Current config read
- [ ] User presented with core strategy settings plus workflow/model/git settings
- [ ] Config updated with mode, granularity, parallelization, commit_docs, model_profile, workflow, and git sections
- [ ] User offered to save as global defaults (~/.gsdt/defaults.json)
- [ ] Changes confirmed to user
</success_criteria>
