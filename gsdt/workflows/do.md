<purpose>
Analyze freeform text from the user and route to the most appropriate GSDT command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate">
**Check for input.**

If `$ARGUMENTS` is empty, ask via AskUserQuestion:

```
What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSDT command.
```

Wait for response before continuing.
</step>

<step name="check_project">
**Check if project exists.**

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" state load 2>/dev/null)
```

Track whether `.claude/.gsdt-planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to command.**

Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:

| If the text describes... | Route to | Why |
|--------------------------|----------|-----|
| Open-ended startup intent, "开始做", "从想法开始", "不知道先做啥" | `/gsdt:auto` | One-click autopilot: collect -> decide -> advance |
| Starting a new project, "set up", "initialize" | `/gsdt:auto` | Default to simplified automatic flow |
| Mapping or analyzing an existing codebase | `/gsdt:map-codebase` | Codebase discovery |
| A bug, error, crash, failure, or something broken | `/gsdt:debug` | Needs systematic investigation |
| Exploring, researching, comparing, or "how does X work" | `/gsdt:research-phase` | Domain research before planning |
| Discussing vision, "how should X look", brainstorming | `/gsdt:discuss-phase` | Needs context gathering |
| A complex task: refactoring, migration, multi-file architecture, system redesign | `/gsdt:add-phase` | Needs a full phase with plan/build cycle |
| Planning a specific phase or "plan phase N" | `/gsdt:plan-phase` | Direct planning request |
| Executing a phase or "build phase N", "run phase N" | `/gsdt:execute-phase` | Direct execution request |
| Running all remaining phases automatically | `/gsdt:autonomous` | Full autonomous execution |
| A review or quality concern about existing work | `/gsdt:verify-work` | Needs verification |
| Checking progress, status, "where am I" | `/gsdt:progress` | Status check |
| Resuming work, "pick up where I left off" | `/gsdt:resume-work` | Session restoration |
| A note, idea, or "remember to..." | `/gsdt:add-todo` | Capture for later |
| Adding tests, "write tests", "test coverage" | `/gsdt:add-tests` | Test generation |
| Completing a milestone, shipping, releasing | `/gsdt:complete-milestone` | Milestone lifecycle |
| A specific, actionable, small task (add feature, fix typo, update config) | `/gsdt:quick` | Self-contained, single executor |

**Requires `.claude/.gsdt-planning/` directory:** All routes except `/gsdt:auto`, `/gsdt:new-project`, `/gsdt:map-codebase`, `/gsdt:help`, and `/gsdt:join-discord`. If the project doesn't exist and the route requires it, suggest `/gsdt:auto` first.

**Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via AskUserQuestion with the top 2-3 options. For example:

```
"Refactor the authentication system" could be:
1. /gsdt:add-phase — Full planning cycle (recommended for multi-file refactors)
2. /gsdt:quick — Quick execution (if scope is small and clear)

Which approach fits better?
```
</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSDT ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```
</step>

<step name="dispatch">
**Invoke the chosen command via SlashCommand.**

Use the SlashCommand tool to invoke the routed command:

```
SlashCommand("/gsdt:{command} {args}")
```

Examples:
- "我想修登录 bug" → `SlashCommand("/gsdt:debug 登录 bug")`
- "我想开始新项目" → `SlashCommand("/gsdt:auto 我想开始一个新项目")`
- "我想继续工作" → `SlashCommand("/gsdt:resume-work")`

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via AskUserQuestion.

After invoking, stop. The dispatched command handles everything from here.
</step>

</process>

<success_criteria>
- [ ] Input validated (not empty)
- [ ] Intent matched to exactly one GSDT command
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
</success_criteria>
