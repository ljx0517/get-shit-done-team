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

<process>

<step name="detect_clis">
Check which AI CLIs are available on the system:

```bash
# Check each CLI
command -v gemini >/dev/null 2>&1 && echo "gemini:available" || echo "gemini:missing"
command -v claude >/dev/null 2>&1 && echo "claude:available" || echo "claude:missing"
command -v codex >/dev/null 2>&1 && echo "codex:available" || echo "codex:missing"
```

Parse flags from `$ARGUMENTS`:
- `--gemini` → include Gemini
- `--claude` → include Claude
- `--codex` → include Codex
- `--all` → include all available
- No flags → include all available
- `--json` → output JSON format
- `--session ID` → resume existing session
- `--threshold N` → confidence threshold (default 0.6)

If no CLIs are available:
```
No external AI CLIs found. Install at least one:
- gemini: https://github.com/google-gemini/gemini-cli
- codex: https://github.com/openai/codex
- claude: https://github.com/anthropics/claude-code

Then run /gsdt:review again.
```
Exit.

If only one CLI is the current runtime (e.g. running inside Claude), skip it for the review
to ensure independence. At least one DIFFERENT CLI must be available.
</step>

<step name="init_session">
Check for existing session or create new:

```bash
# Check for --session flag
if [[ "$ARGUMENTS" == *"--session"* ]]; then
  SESSION_ID=$(echo "$ARGUMENTS" | grep -oP '(?<=--session )[^\s]+')
  SESSION=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review get "$SESSION_ID")
  if [[ -z "$SESSION" ]]; then
    echo "Session not found: $SESSION_ID"
    exit 1
  fi
  echo "Resuming session: $SESSION_ID"
else
  # Create new session
  SESSION=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review create-session \
    --type cross-ai --phase "${PHASE_ARG}" \
    --reviewers gemini,claude,codex 2>/dev/null)
  SESSION_ID=$(echo "$SESSION" | grep -oP '"session_id":"[^"]+' | cut -d'"' -f4)
fi
```

Store SESSION_ID for later use.
</step>

<step name="gather_context">
Collect phase artifacts for the review prompt:

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Read from init: `phase_dir`, `phase_number`, `padded_phase`.

Then read:
1. `.claude/.gsdt-planning/PROJECT.md` (first 80 lines — project context)
2. Phase section from `.claude/.gsdt-planning/ROADMAP.md`
3. All `*-PLAN.md` files in the phase directory
4. `*-CONTEXT.md` if present (user decisions)
5. `*-RESEARCH.md` if present (domain research)
6. `.claude/.gsdt-planning/REQUIREMENTS.md` (requirements this phase addresses)
</step>

<step name="build_prompt">
Build a structured review prompt:

```markdown
# Cross-AI Plan Review Request

You are reviewing implementation plans for a software project phase.
Provide structured feedback on plan quality, completeness, and risks.

## Project Context
{first 80 lines of PROJECT.md}

## Phase {N}: {phase name}
### Roadmap Section
{roadmap phase section}

### Requirements Addressed
{requirements for this phase}

### User Decisions (CONTEXT.md)
{context if present}

### Research Findings
{research if present}

### Plans to Review
{all PLAN.md contents}

## Review Instructions

Analyze each plan and provide structured feedback:

1. **Summary** — One-paragraph assessment
2. **Strengths** — What's well-designed (bullet points)
3. **Concerns** — Potential issues, gaps, risks (bullet points with severity: HIGH/MEDIUM/LOW)
4. **Suggestions** — Specific improvements (bullet points)
5. **Risk Assessment** — Overall risk level (LOW/MEDIUM/HIGH) with justification

**IMPORTANT:** For each concern, also provide:
- `confidence: 0.0-1.0` — How confident you are in this finding
- `autofix_class: safe_auto|gated_auto|manual|advisory` — Whether this can be auto-fixed

Focus on:
- Missing edge cases or error handling
- Dependency ordering issues
- Scope creep or over-engineering
- Security considerations
- Performance implications
- Whether the plans actually achieve the phase goals

Output your review in structured format:

```json
{
  "findings": [
    {
      "title": "Issue title (10 words max)",
      "description": "Detailed description of the issue",
      "severity": "P0|P1|P2|P3",
      "confidence": 0.0-1.0,
      "autofix_class": "safe_auto|gated_auto|manual|advisory",
      "file": "file path if applicable",
      "line": line number if applicable
    }
  ]
}
```

If no issues found, return: `{ "findings": [] }`
```

Write to a temp file: `/tmp/gsd-review-prompt-{phase}.md`
</step>

<step name="invoke_reviewers_parallel">
For each selected CLI, invoke IN PARALLEL (not sequential):

**Gemini:**
```bash
gemini -p "$(cat /tmp/gsd-review-prompt-{phase}.md)" 2>/dev/null > /tmp/gsd-review-gemini-{phase}.json &
```

**Claude (separate session):**
```bash
claude -p "$(cat /tmp/gsd-review-prompt-{phase}.md)" --no-input 2>/dev/null > /tmp/gsd-review-claude-{phase}.json &
```

**Codex:**
```bash
codex exec --skip-git-repo-check "$(cat /tmp/gsd-review-prompt-{phase}.md)" 2>/dev/null > /tmp/gsd-review-codex-{phase}.json &
```

**Wait for all to complete:**
```bash
wait
```

Display progress:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CROSS-AI REVIEW — Phase {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Reviewing with {CLI}... (parallel)...
◆ All reviewers complete
```
</step>

<step name="parse_and_merge">
Parse each reviewer's output and merge with deduplication:

```bash
# Parse each output
GEMINI_FINDINGS=$(cat /tmp/gsd-review-gemini-{phase}.json 2>/dev/null | jq -r '.findings // []' 2>/dev/null || echo "[]")
CLAUDE_FINDINGS=$(cat /tmp/gsd-review-claude-{phase}.json 2>/dev/null | jq -r '.findings // []' 2>/dev/null || echo "[]")
CODEX_FINDINGS=$(cat /tmp/gsd-review-codex-{phase}.json 2>/dev/null | jq -r '.findings // []' 2>/dev/null || echo "[]")

# Combine into unified JSON with source tracking
COMBINED=$(jq -n \
  --argjson gemini "$GEMINI_FINDINGS" \
  --argjson claude "$CLAUDE_FINDINGS" \
  --argjson codex "$CODEX_FINDINGS" \
  '{
    reviewers: [
      { source: "gemini", findings: $gemini },
      { source: "claude", findings: $claude },
      { source: "codex", findings: $codex }
    ]
  }')

# Save combined for deduplication
echo "$COMBINED" > /tmp/gsd-review-combined-{phase}.json
```

Run deduplication and boost via the review engine:

```bash
# This would call the review module's deduplication
# For now, we'll use jq-based deduplication
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review dedupe \
  --session "$SESSION_ID" \
  --input /tmp/gsd-review-combined-{phase}.json
```

Update session with findings:
```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review add-findings \
  --session "$SESSION_ID" \
  --findings /tmp/gsd-review-combined-{phase}.json
```
</step>

<step name="write_reviews">
Combine all review responses into `{phase_dir}/{padded_phase}-REVIEWS.md`:

```markdown
---
phase: {N}
reviewers: [gemini, claude, codex]
reviewed_at: {ISO timestamp}
session_id: {SESSION_ID}
plans_reviewed: [{list of PLAN.md files}]
---

# Cross-AI Plan Review — Phase {N}

## Summary

| Reviewer | Findings | High Confidence |
|----------|----------|-----------------|
| Gemini | {count} | {count ≥0.7} |
| Claude | {count} | {count ≥0.7} |
| Codex | {count} | {count ≥0.7} |

## Consensus Issues

{issues confirmed by 2+ reviewers — highest priority}

## Gemini Review

{filtered gemini findings with severity badges}

---

## Claude Review

{filtered claude findings with severity badges}

---

## Codex Review

{filtered codex findings with severity badges}

---

## Routing

| Severity | Count | Action |
|----------|-------|--------|
| P0 | {n} | Immediate fix |
| P1 | {n} | Next sprint |
| P2 | {n} | Backlog |
| P3 | {n} | Optional |

## JSON Output

Full structured data available at: `{phase_dir}/{padded_phase}-REVIEWS.json`
```

Also write JSON output:
```bash
# Write structured JSON
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review output \
  --session "$SESSION_ID" \
  --phase-dir "${PHASE_DIR}" \
  --padded-phase "${PADDED_PHASE}" \
  --json > "${PHASE_DIR}/${PADDED_PHASE}-REVIEWS.json"
```

Commit:
```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" commit "docs: cross-AI review for phase {N}" --files "{phase_dir}/{padded_phase}-REVIEWS.md" "{phase_dir}/{padded_phase}-REVIEWS.json"
```
</step>

<step name="present_results">
Display summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► REVIEW COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session: {SESSION_ID}
Phase {N} reviewed by {count} AI systems.

Total findings: {N} (raw) → {N} (after dedup) → {N} (after filter)

Consensus concerns:
{top 3 shared concerns}

Full review: {padded_phase}-REVIEWS.md
JSON data: {padded_phase}-REVIEWS.json

To incorporate feedback into planning:
  /gsdt:plan-phase {N} --reviews
```

Clean up temp files:
```bash
rm -f /tmp/gsd-review-{phase}.md \
       /tmp/gsd-review-gemini-{phase}.json \
       /tmp/gsd-review-claude-{phase}.json \
       /tmp/gsd-review-codex-{phase}.json \
       /tmp/gsd-review-combined-{phase}.json
```
</step>

</process>

<success_criteria>
- [ ] At least one external CLI invoked successfully
- [ ] Parallel execution completed (all reviewers in parallel)
- [ ] Session created/managed
- [ ] REVIEWS.md written with structured feedback
- [ ] JSON output generated
- [ ] Consensus summary synthesized from multiple reviewers
- [ ] Temp files cleaned up
- [ ] User knows how to use feedback (/gsdt:plan-phase --reviews)
</success_criteria>
