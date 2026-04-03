<purpose>
Resolve semantic duplicates, canonical units, and conflicts for intake units.
</purpose>

<required_reading>
Read the invoking command, the provided normalized units, and current intake/planning context before deciding.
</required_reading>

<process>

<step name="load_inputs">
Treat `$ARGUMENTS` as the normalized units payload, which may come from inline JSON or an `@file` reference.

Read these files if present:
- `.claude/.gsdt-intake/ledger.json`
- `.claude/.gsdt-intake/readiness.json`
- `.claude/.gsdt-planning/ROADMAP.md`
- `.claude/.gsdt-planning/STATE.md`
</step>

<step name="resolve_units">
Resolve the units conservatively.

Rules:
- prefer updating an existing canonical unit over creating a near-duplicate
- if two units describe the same intent with different wording, merge them semantically
- if two units compete or constrain each other, preserve both and mark the conflict explicitly
- preserve `phase_hint` only when the overlap is real, not speculative
- do not erase ambiguity by over-smoothing conflicting evidence

Return exactly one machine-readable block:
<intake_resolution_json>
{
  "canonical_units": [...],
  "duplicates": [...],
  "conflicts": [...]
}
</intake_resolution_json>
</step>

</process>
