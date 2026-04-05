<purpose>
Retroactive 6-pillar visual audit of implemented frontend code. Standalone command that works on any project — GSD-managed or not. Produces scored UI-REVIEW.md with actionable findings.

**Enhanced with:**
- Session management with checkpoint/resume
- Structured JSON output (machine-readable)
- Confidence scoring for findings
- Integration with unified review system
</purpose>

<required_reading>
@~/.claude/gsdt/references/ui-brand.md
@~/.claude/gsdt/references/ui-review-calibration.md
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsdt-ui-auditor — Audits UI against design requirements
</available_agent_types>

<process>

## 0. Initialize

```bash
INIT=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
AGENT_SKILLS_UI_REVIEWER=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" agent-skills gsd-ui-reviewer 2>/dev/null)
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `commit_docs`.

**Parse flags from `$ARGUMENTS`:**
- `--json` → Request JSON output from auditor
- `--session ID` → Resume existing session
- `--threshold N` → Confidence threshold (default 0.6)

```bash
UI_AUDITOR_MODEL=$(node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" resolve-model gsdt-ui-auditor --raw)
```

Display banner:
```
── GSD ► UI AUDIT — PHASE {N}: {name} ──
```

## 1. Session Management

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
    --type ui-audit --phase "${PHASE_ARG}" \
    --reviewers ui-auditor 2>/dev/null)
  SESSION_ID=$(echo "$SESSION" | grep -oP '"session_id":"[^"]+' | cut -d'"' -f4)
fi
```

## 2. Detect Input State

```bash
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
UI_REVIEW_FILE=$(ls "${PHASE_DIR}"/*-UI-REVIEW.md 2>/dev/null | head -1)
```

**If `SUMMARY_FILES` empty:** Exit — "Phase {N} not executed. Run /gsdt:execute-phase {N} first."

**If `UI_REVIEW_FILE` non-empty:** Use AskUserQuestion:
- header: "Existing UI Review"
- question: "UI-REVIEW.md already exists for Phase {N}."
- options:
  - "Re-audit — run fresh audit"
  - "View — display current review and exit"

If "View": display file, exit.
If "Re-audit": continue.

## 3. Gather Context Paths

Build file list for auditor:
- All SUMMARY.md files in phase dir
- All PLAN.md files in phase dir
- UI-SPEC.md (if exists — audit baseline)
- CONTEXT.md (if exists — locked decisions)

## 4. Spawn gsdt-ui-auditor

```
◆ Spawning UI auditor...
```

Build prompt:

```markdown
Read ~/.claude/agents/gsdt-ui-auditor.md for instructions.

<objective>
Conduct 6-pillar visual audit of Phase {phase_number}: {phase_name}
{If UI-SPEC exists: "Audit against UI-SPEC.md design contract."}
{If no UI-SPEC: "Audit against abstract 6-pillar standards."}
</objective>

<files_to_read>
- {summary_paths} (Execution summaries)
- {plan_paths} (Execution plans — what was intended)
- {ui_spec_path} (UI Design Contract — audit baseline, if exists)
- {context_path} (User decisions, if exists)
</files_to_read>

${AGENT_SKILLS_UI_REVIEWER}

<config>
phase_dir: {phase_dir}
padded_phase: {padded_phase}
{If --json flag: --json}
</config>
```

**If `--json` flag passed:** Add to prompt:
```
<json_output>
Output findings as structured JSON alongside the Markdown report.
Write to: $PHASE_DIR/$PADDED_PHASE-UI-REVIEW.json
</json_output>
```

Omit null file paths.

```
Task(
  prompt=ui_audit_prompt,
  subagent_type="gsdt-ui-auditor",
  model="{UI_AUDITOR_MODEL}",
  description="UI Audit Phase {N}"
)
```

## 5. Handle Return

**If `## UI REVIEW COMPLETE`:**

Display score summary:

```
── GSD ► UI AUDIT COMPLETE ✓ ──
**Phase {N}: {Name}** — Overall: {score}/24

| Pillar | Score |
|--------|-------|
| Copywriting | {N}/4 |
| Visuals | {N}/4 |
| Color | {N}/4 |
| Typography | {N}/4 |
| Spacing | {N}/4 |
| Experience Design | {N}/4 |

Session: {SESSION_ID}

Top fixes:
1. {fix}
2. {fix}
3. {fix}

Full review: {path to UI-REVIEW.md}
{If --json: JSON data: {path to UI-REVIEW.json}}

───────────────────────────────────────────────────────────────

## ▶ Next

- `/gsdt:verify-work {N}` — UAT testing
- `/gsdt:plan-phase {N+1}` — plan next phase

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────
```

## 6. Complete Session

Update session with findings:

```bash
# If JSON was generated, update session with findings
if [[ -f "${PHASE_DIR}/${PADDED_PHASE}-UI-REVIEW.json" ]]; then
  node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review add-findings \
    --session "$SESSION_ID" \
    --findings "${PHASE_DIR}/${PADDED_PHASE}-UI-REVIEW.json"
fi

# Complete the session
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" review complete-session "$SESSION_ID"
```

## 7. Commit (if configured)

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" commit "docs(${padded_phase}): UI audit review" --files "${PHASE_DIR}/${PADDED_PHASE}-UI-REVIEW.md"
{If --json: --files "${PHASE_DIR}/${PADDED_PHASE}-UI-REVIEW.json"}
```

</process>

<success_criteria>
- [ ] Phase validated
- [ ] SUMMARY.md files found (execution completed)
- [ ] Session created/managed
- [ ] Existing review handled (re-audit/view)
- [ ] gsdt-ui-auditor spawned with correct context
- [ ] UI-REVIEW.md created in phase directory
- [ ] {If --json: UI-REVIEW.json created with structured findings}
- [ ] Score summary displayed to user
- [ ] Next steps presented
</success_criteria>
