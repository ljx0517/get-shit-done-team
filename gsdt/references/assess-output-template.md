# Assess Output Template

Verdict: `{clean | auto_fixed | blocking_findings | degraded}`

This is the compact artifact contract for `*-ASSESS.md`.
For the full synthesized presentation format, also see:
`gsdt/references/assess-review-output-template.md`

## Summary

- Phase: `{phase_number}-{phase_name}`
- Session: `{session_id}`
- Mode: `internal_auto`
- Reviewers completed: `{reviewers}`
- Raw findings: `{total_raw}`
- After dedupe: `{total_after_dedup}`
- After filter: `{total_after_filter}`
- Suppressed: `{suppressed_count}`
- Boosted: `{boosted_count}`

## Safe Auto Queue

- `{safe_auto finding titles}`

### Assess Gaps

- `{blocking findings that must enter gap_closure}`

### Report Only

- `{pre_existing or advisory findings}`

### Learnings & Past Solutions

- `{known patterns or compound references}`

### Residual Risks

- `{residual risks still present after assess}`

### Testing Gaps

- `{tests still missing after assess}`

### Compound Emissions

- `{resolved findings emitted through compound dispatch}`

### Coverage

- `{reviewer failures, intent uncertainty, suppressed counts}`
