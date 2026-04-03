<purpose>
Normalize raw intake text into conservative semantic planning units.
</purpose>

<required_reading>
Read the invoking command and any relevant intake or planning files before deciding.
</required_reading>

<process>

<step name="load_context">
Read these files if present:
- `.claude/.gsdt-intake/ledger.json`
- `.claude/.gsdt-intake/readiness.json`
- `.claude/.gsdt-planning/ROADMAP.md`
- `.claude/.gsdt-planning/STATE.md`
</step>

<step name="normalize_input">
Convert the provided raw intake text into 1-N planning units.

Allowed unit types:
- `user_story`
- `constraint`
- `preference`
- `technical_enabler`
- `open_question`

Normalization rules:
- preserve the original meaning conservatively
- prefer `constraint` or `preference` over fabricating a `user_story`
- only emit `user_story` when there is a meaningful actor + need + value path
- if actor, need, or value is unclear, lower confidence or emit `open_question`
- technical implementation notes alone MUST NOT be promoted as user stories
- future-looking or deferred work SHOULD remain backlog-oriented instead of being forced into the active phase
- if initialized project context exists, include `phase_hint` only when there is concrete roadmap overlap

Unit schema:
- required: `type`, `summary`, `confidence`
- optional: `actor`, `need`, `value`, `phase_hint`, `open_questions`, `status`

Return exactly one machine-readable block:
<intake_units_json>
{"units":[...]}
</intake_units_json>
</step>

</process>
