---
name: gsdt:debug
description: Systematic debugging with persistent state across context resets
argument-hint: [issue description]
allowed-tools:
  - Read
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Debug issues using scientific method with subagent isolation.

**Orchestrator role:** Gather symptoms, spawn gsdt-debugger agent, handle checkpoints, spawn continuations.

**Why subagent:** Investigation burns context fast (reading files, forming hypotheses, testing). Fresh 200k context per investigation. Main context stays lean for user interaction.
</objective>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsdt-debugger — Diagnoses and fixes issues
</available_agent_types>

<context>
User's issue: $ARGUMENTS

Check for active sessions:
```bash
ls .gsdt-planning/debug/*.md 2>/dev/null | grep -v resolved | head -5
```
</context>

<process>

## 0. Initialize Context

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" state load)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract `commit_docs` from init JSON. Resolve debugger model:
```bash
debugger_model=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" resolve-model gsdt-debugger --raw)
```

## 1. Check Active Sessions

If active sessions exist AND no $ARGUMENTS:
- List sessions with status, hypothesis, next action
- User picks number to resume OR describes new issue

If $ARGUMENTS provided OR user describes new issue:
- Continue to symptom gathering

## 2. Gather Symptoms (if new issue)

Use AskUserQuestion for each:

1. **Expected behavior** - What should happen?
2. **Actual behavior** - What happens instead?
3. **Error messages** - Any errors? (paste or describe)
4. **Timeline** - When did this start? Ever worked?
5. **Reproduction** - How do you trigger it?

After all gathered, confirm ready to investigate.

## 3. Spawn gsdt-debugger Agent

Fill prompt and spawn:

```markdown
<objective>
Investigate issue: {slug}

**Summary:** {trigger}
</objective>

<symptoms>
expected: {expected}
actual: {actual}
errors: {errors}
reproduction: {reproduction}
timeline: {timeline}
</symptoms>

<mode>
symptoms_prefilled: true
goal: find_and_fix
</mode>

<debug_file>
Create: .gsdt-planning/debug/{slug}.md
</debug_file>
```

```
Task(
  prompt=filled_prompt,
  subagent_type="gsdt-debugger",
  model="{debugger_model}",
  description="Debug {slug}"
)
```

## 4. Handle Agent Return

**If `## ROOT CAUSE FOUND`:**
- 立即在后台写入一个 `diagnosed` compound event，并调用 `compound dispatch`
- `compound dispatch` 不等待完成，不改变当前 debug 对话节奏
- 自动模式只做知识沉淀，不新增用户选项，不询问用户
- Display root cause and evidence summary
- Offer options:
  - "Fix now" - spawn fix subagent
  - "Plan fix" - suggest /gsdt:plan-phase --gaps
  - "Manual fix" - done

后台 sidecar 事件至少包含:

```json
{
  "source": "debug",
  "status": "diagnosed",
  "problem": "debug session summary",
  "symptoms": ["observed symptom"],
  "root_cause": "confirmed root cause",
  "severity": "major",
  "files": ["affected/file.ts"],
  "debug_session": "debug-session-slug",
  "tags": ["debug", "auto-compound"]
}
```

Dispatch command:

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" compound dispatch \
  --event-file "$EVENT_FILE" \
  >/tmp/gsdt-debug-compound.log 2>&1 &
```

**If `## CHECKPOINT REACHED`:**
- Present checkpoint details to user
- Get user response
- If checkpoint type is `human-verify`:
  - If user confirms fixed: continue so agent can finalize/resolve/archive
  - If user reports issues: continue so agent returns to investigation/fixing
- Spawn continuation agent (see step 5)

**If `## INVESTIGATION INCONCLUSIVE`:**
- Show what was checked and eliminated
- Offer options:
  - "Continue investigating" - spawn new agent with additional context
  - "Manual investigation" - done
  - "Add more context" - gather more symptoms, spawn again

## 5. Spawn Continuation Agent (After Checkpoint)

When user responds to checkpoint, spawn fresh agent:

```markdown
<objective>
Continue debugging {slug}. Evidence is in the debug file.
</objective>

<prior_state>
<files_to_read>
- .gsdt-planning/debug/{slug}.md (Debug session state)
</files_to_read>
</prior_state>

<checkpoint_response>
**Type:** {checkpoint_type}
**Response:** {user_response}
</checkpoint_response>

<mode>
goal: find_and_fix
</mode>
```

```
Task(
  prompt=continuation_prompt,
  subagent_type="gsdt-debugger",
  model="{debugger_model}",
  description="Continue debug {slug}"
)
```

</process>

<success_criteria>
- [ ] Active sessions checked
- [ ] Symptoms gathered (if new)
- [ ] gsdt-debugger spawned with context
- [ ] Checkpoints handled correctly
- [ ] Root cause confirmed before fixing
</success_criteria>
