# Assess Review Output Template

Use this format when synthesizing the final Assess report.

## Example

```markdown
## Assess Results

**Scope:** Phase 04 changed files plus verification and summary artifacts
**Intent:** Close quality gaps for comment refresh handling without widening scope
**Mode:** internal_auto
**Reviewers:** correctness, testing, maintainability, learnings, performance

### P1 -- High

| # | File | Issue | Reviewer | Confidence | Route |
|---|------|-------|----------|------------|-------|
| 1 | `src/comments/list.ts:88` | Effect dependency causes duplicate refetch loop | correctness, performance | 0.82 | `safe_auto -> review-fixer` |
| 2 | `src/comments/list.test.ts:41` | Missing test for rapid comment creation path | testing | 0.77 | `manual -> downstream-resolver` |

### Safe Auto Queue

| # | File | Issue | Verification |
|---|------|-------|--------------|
| 1 | `src/comments/list.ts:88` | Effect dependency causes duplicate refetch loop | `targeted_test` |

### Assess Gaps

| # | File | Issue | Route | Why It Matters |
|---|------|-------|-------|----------------|
| 1 | `src/comments/list.test.ts:41` | Missing test for rapid comment creation path | `manual -> downstream-resolver` | Fast repeated submits can regress silently |

### Report Only

| # | File | Issue | Reviewer |
|---|------|-------|----------|
| 1 | `src/comments/utils.ts:14` | Nested helper remains hard to read | maintainability |

### Learnings & Past Solutions

- [Known Pattern] `docs/solutions/ui-bugs/comment-refresh-loop.md`

### Residual Risks

- Bulk comment loading may still be slow under heavy concurrency

### Testing Gaps

- No concurrency test for rapid comment creation

### Compound Emissions

- Duplicate request loop: processed

### Coverage

- Suppressed: 1 finding below 0.60 confidence
- Reviewer failures: none

---

> **Verdict:** Ready with fixes
>
> **Reasoning:** One safe auto fix can be applied automatically; one blocking test gap must still enter gap closure.
```

## Rules

- Group findings by severity before routing sections.
- `Safe Auto Queue`, `Assess Gaps`, and `Report Only` are mandatory sections even when empty.
- Keep residual risks and testing gaps outside the main findings tables.
- End with a verdict and short reasoning.
