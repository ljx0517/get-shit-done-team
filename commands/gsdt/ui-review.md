<purpose>
Retroactive 6-pillar visual audit of implemented frontend code.
Produces UI-REVIEW.md with graded assessment (1-4 per pillar).
Output: {phase_num}-UI-REVIEW.md

**Enhanced with:**
- Session management with checkpoint/resume
- Structured JSON output (machine-readable)
- Confidence scoring for findings
- Integration with unified review system
</purpose>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.

**Flags:**
- `--json` — Output JSON format (machine-readable findings)
- `--session ID` — Resume existing session
- `--threshold N` — Confidence threshold (default 0.6)
</context>

<process>
Execute @~/.claude/gsdt/workflows/ui-review.md end-to-end.
Preserve all workflow gates.
</process>
