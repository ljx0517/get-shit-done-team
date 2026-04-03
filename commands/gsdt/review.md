<purpose>
Cross-AI peer review — invoke external AI CLIs to independently review phase plans.
Each CLI gets the same prompt (PROJECT.md context, phase plans, requirements) and
produces structured feedback. Results are combined into REVIEWS.md for the planner
to incorporate via --reviews flag.

This implements adversarial review: different AI models catch different blind spots.
A plan that survives review from 2-3 independent AI systems is more robust.

**Enhanced with:**
- Parallel execution (not sequential)
- Session management with checkpoint/resume
- Fingerprint deduplication + cross-reviewer boost
- Confidence filtering
- Structured JSON output + Markdown
</purpose>

<context>
Phase number: extracted from $ARGUMENTS (required)

**Flags:**
- `--gemini` — Include Gemini CLI review
- `--claude` — Include Claude CLI review (uses separate session)
- `--codex` — Include Codex CLI review
- `--all` — Include all available CLIs
- `--json` — Output JSON format (machine-readable)
- `--session ID` — Resume existing session
- `--threshold N` — Confidence threshold (default 0.6)
</context>

<process>
Execute the review workflow from @~/.claude/gsdt/workflows/review.md end-to-end.
</process>
