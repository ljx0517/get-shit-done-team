<purpose>
Provide a zero-friction entrypoint that minimizes manual steps:
auto collect -> auto decide -> auto advance.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate_input">
If `$ARGUMENTS` is empty, ask for one sentence of idea text and stop.
</step>

<step name="collect">
Show one-line status only:
`收集中 | next=capture`

Dispatch capture:
```
SlashCommand("/gsdt:capture $ARGUMENTS ${GSD_WS}")
```

Do not expand into extra analysis here — capture workflow owns extraction and graph updates.
</step>

<step name="decide">
Show one-line status only:
`判断中 | next=decide`

Run deterministic decision:
```bash
DECIDE=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" capture decide)
if [[ "$DECIDE" == @file:* ]]; then DECIDE=$(cat "${DECIDE#@file:}"); fi
```

Parse:
- `decision.next_action`
- `one_line_status`
</step>

<step name="route">
Route by `decision.next_action`:

- `collect_more`:
  - Show one-line status only:
    `收集中 | next=collect_more`
  - Stop.

- `trigger_new_project`:
  - Show one-line status only:
    `初始化中 | next=trigger_new_project`
  - Do not call discuss-phase directly in this step.
  - Let capture cold-start chain execute `new-project --auto` first.
  - Stop.

- `trigger_discuss_phase`:
  - Show one-line status only:
    `规划中 | next=trigger_discuss_phase`
  - Dispatch:
    ```
    SlashCommand("/gsdt:discuss-phase 1 --auto ${GSD_WS}")
    ```
  - Stop.
</step>

<step name="self_heal_retry_policy">
For automatic dispatches in this workflow:
- Retry up to 3 times for transient failures (2s, 4s, 8s backoff).
- If still failing, show one-line blocked state and stop:
  `初始化中 | next=blocked`
</step>

</process>

<success_criteria>
- One command entrypoint exists (`/gsdt:auto`)
- Input is collected without extra manual routing
- Next action comes from deterministic `capture decide`
- Cold start never jumps directly to discuss before roadmap exists
- User-facing output remains one-line status oriented
</success_criteria>
