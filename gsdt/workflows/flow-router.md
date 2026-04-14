<purpose>
State-first workflow router for GSDT. Given natural language plus optional machine-readable state flags, emit **one JSON object** describing the next slash command(s). Intended for tooling and scripted Claude Code sessions.
</purpose>

<required_reading>
Parse `$ARGUMENTS` (or the invoking prompt body) for:
1. **Natural language** — the user’s freeform phrase (e.g. `开始`, `修登录`).
2. **State flags** — key=value tokens such as `needs_new_project=true` (boolean), `gsdt_enabled=true`, etc.
</required_reading>

<output_contract critical="true">
**Claude Code must obey this exactly.**

1. The **entire** assistant reply MUST be **one JSON object** and **nothing else**.
2. **Forbidden:** Markdown fences (\`\`\`json), headings, explanations, bullet lists, “Thinking”, or any character before `{` or after the closing `}`.
3. The JSON MUST be **valid RFC 8259** (double-quoted keys, no trailing commas).
4. **No** pretty-print requirement: minified or indented is fine as long as the reply is only that JSON.
5. If routing is impossible (empty input and no state), still return JSON using `"error"` per schema below.

This workflow **never** invokes SlashCommand, **never** runs Bash, and **never** asks the user follow-up questions in prose — only the JSON object.
</output_contract>

<json_schema>
Emit an object with at least:

| Field | Type | Meaning |
|-------|------|---------|
| `router_version` | string | Fixed: `"1"` |
| `input_natural_language` | string | Parsed phrase or `""` |
| `state` | object | Booleans copied from input flags; default missing keys to `false` unless unknown |
| `primary` | object | `{ "slash_command": string, "reason": string }` — main recommendation |
| `alternates` | array | Optional `{ "slash_command", "reason" }[]` |
| `notes` | string | Short machine-oriented note (may be empty) |

Optional top-level `"error"` (string) when input is unusable; still return full object shape with `primary` explaining recovery (e.g. `/gsdt:auto`).

**`reason` fields** are concise English or bilingual strings **inside JSON** — they are not a license to add non-JSON text outside the object.
</json_schema>

<routing_rules>
Apply **first match wins** using resolved booleans (treat `needs_new_project` as true if no `.gsdt-planning/` is implied by flags and `needs_new_project=true`).

1. **`needs_new_project=true`** (cold start)  
   - `primary.slash_command`: `/gsdt:auto` + append trimmed natural language if non-empty, else `/gsdt:auto`  
   - `alternates`: include `{ "slash_command": "/gsdt:new-project", "reason": "Full manual init: questions → research → requirements → roadmap." }`

2. **`needs_new_milestone=true`** and not (1)  
   - `primary`: `/gsdt:new-milestone`

3. **`has_plan_in_workspace=false`** and roadmap exists / current phase known from state **and** not (1)(2) — if the only signal is “continue work”, use `/gsdt:next` when `gsdt_enabled=true` and planning dir exists; otherwise prefer `/gsdt:progress`.

4. **`gsd_incomplete=true`** — `primary`: `/gsdt:resume-work` or `/gsdt:next` with reason referencing incomplete GSD state.

5. Default when `gsdt_enabled=true` and project exists: `/gsdt:next`.

6. **`has_dev_teammate=true`** does not change `slash_command`; mention in `notes` only.

Natural language hints (subset): 开始/想做/不知道 → reinforce `auto`; 已有代码/legacy → add alternate `/gsdt:map-codebase` when `needs_new_project=true`.
</routing_rules>

<example_output>
{"router_version":"1","input_natural_language":"开始","state":{"gsdt_enabled":true,"needs_new_project":true,"needs_new_milestone":false,"gsd_incomplete":false,"has_plan_in_workspace":false,"has_dev_teammate":false},"primary":{"slash_command":"/gsdt:auto 开始","reason":"Cold start: no planning tree; auto chains capture and new-project when ready."},"alternates":[{"slash_command":"/gsdt:new-project","reason":"Full manual init path."}],"notes":""}
</example_output>

<success_criteria>
- [ ] Reply is **only** JSON, valid parse.
- [ ] `primary.slash_command` starts with `/gsdt:`.
- [ ] No extra text, fences, or tool calls after routing.
</success_criteria>
