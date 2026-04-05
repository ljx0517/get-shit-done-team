<purpose>
Detect current project state and automatically advance to the next logical GSDT workflow step.
Reads project state to determine: discuss → plan → execute → verify → complete progression.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="detect_state">
Read project state to determine current position:

```bash
# Get state snapshot
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" state json 2>/dev/null || echo "{}"
```

Also read:
- `.claude/.gsdt-planning/STATE.md` — current phase, progress, plan counts
- `.claude/.gsdt-planning/ROADMAP.md` — milestone structure and phase list

Extract:
- `current_phase` — which phase is active
- `plan_of` / `plans_total` — plan execution progress
- `progress` — overall percentage
- `status` — active, paused, etc.

If no `.claude/.gsdt-planning/` directory exists:
```
No GSDT project detected. Run `/gsdt:new-project` to get started.
```
Exit.
</step>

<step name="determine_next_action">
Apply routing rules based on state:

**Route 1: No phases exist yet → discuss**
If ROADMAP has phases but no phase directories exist on disk:
→ Next action: `/gsdt:discuss-phase <first-phase>`

**Route 2: Phase exists but has no CONTEXT.md or RESEARCH.md → discuss**
If the current phase directory exists but has neither CONTEXT.md nor RESEARCH.md:
→ Next action: `/gsdt:discuss-phase <current-phase>`

**Route 3: Phase has context but no plans → plan**
If the current phase has CONTEXT.md (or RESEARCH.md) but no PLAN.md files:
→ Next action: `/gsdt:plan-phase <current-phase>`

**Route 4: Phase has plans but incomplete summaries → execute**
If plans exist but not all have matching summaries:
→ Next action: `/gsdt:execute-phase <current-phase>`

**Route 5: All plans have summaries → verify and complete**
If all plans in the current phase have summaries:
→ Next action: `/gsdt:verify-work` then `/gsdt:complete-phase`

**Route 6: Phase complete, next phase exists → advance**
If the current phase is complete and the next phase exists in ROADMAP:
→ Next action: `/gsdt:discuss-phase <next-phase>`

**Route 7: All phases complete → complete milestone**
If all phases are complete:
→ Next action: `/gsdt:complete-milestone`

**Route 8: Paused → resume**
If STATE.md shows paused_at:
→ Next action: `/gsdt:resume-work`
</step>

<step name="show_and_execute">
Display the determination:

```
## GSDT Next

**Current:** Phase [N] — [name] | [progress]%
**Status:** [status description]

▶ **Next step:** `/gsdt:[command] [args]`
  [One-line explanation of why this is the next step]
```

Then immediately invoke the determined command via SlashCommand.
Do not ask for confirmation — the whole point of `/gsdt:next` is zero-friction advancement.
</step>

<step name="invoke_command">
**Auto-invoke the determined command.**

Use SlashCommand to invoke the command determined in the previous step:

```
SlashCommand("/gsdt:{command} {args}")
```

Examples:
- If determined: `/gsdt:execute-phase 3` → `SlashCommand("/gsdt:execute-phase 3")`
- If determined: `/gsdt:discuss-phase 2` → `SlashCommand("/gsdt:discuss-phase 2")`

After invoking, stop. The dispatched command handles all output.
</step>

</process>

<success_criteria>
- [ ] Project state correctly detected
- [ ] Next action correctly determined from routing rules
- [ ] Command invoked immediately without user confirmation
- [ ] Clear status shown before invoking
</success_criteria>
