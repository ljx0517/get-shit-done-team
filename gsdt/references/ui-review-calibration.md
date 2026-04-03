# UI Review Calibration Standards

## Scoring Anchors (1-4 per pillar)

Each pillar scores 1-4 based on these definitions:

- **4 (Excellent)** — No issues found, substantially exceeds contract
- **3 (Good)** — Minor issues, contract substantially met
- **2 (Needs Work)** — Notable gaps, contract partially met
- **1 (Poor)** — Significant issues, contract not met

---

## Pillar-Specific Anchors

### 1. Copywriting

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | All CTAs are specific and actionable; empty states have descriptive copy; errors are helpful and suggest recovery | "Upload a profile photo (JPEG, PNG, max 5MB)" instead of "Upload" |
| **3** | Most CTAs are good; minor issues with empty/error states | |
| **2** | Multiple generic labels ("Submit", "Click Here"); generic error messages | |
| **1** | All CTAs are generic; no error guidance; empty states show nothing | "Submit", "Click Here", "OK", "Cancel" everywhere |

### 2. Visuals

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | Clear focal point; visual hierarchy evident; icon-only buttons have aria-labels | |
| **3** | Good overall structure; minor hierarchy issues | |
| **2** | Confusing layout; unclear visual hierarchy; missing labels | |
| **1** | No design sense; random placement; no hierarchy | |

### 3. Color

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | Accent color <10% of UI; no hardcoded colors; design tokens used | |
| **3** | Accent ~10-20%; few hardcoded colors | |
| **2** | Accent >20%; 1-2 hardcoded colors; no design system | |
| **1** | No design system; random colors throughout; heavy hardcoding | |

### 4. Typography

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | ≤3 font sizes; ≤2 font weights; clear hierarchy | |
| **3** | 4-5 sizes; consistent weights | |
| **2** | 5+ sizes; inconsistent weights | |
| **1** | No typographic hierarchy; random sizes | |

### 5. Spacing

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | Consistent spacing; no arbitrary values; scale followed | |
| **3** | Mostly consistent; rare arbitrary values | |
| **2** | Frequent arbitrary values; inconsistent patterns | |
| **1** | No spacing system; random values throughout | |

### 6. Experience Design

| Score | Definition | Examples |
|-------|------------|----------|
| **4** | All async operations have loading/error/empty states; destructive actions have confirmation | |
| **3** | Most async states covered; minor gaps | |
| **2** | Only loading states present; no error/empty handling | |
| **1** | No UX states; actions don't handle async or error | |

---

## Severity Mapping

UI findings severity is mapped from pillar scores:

| Pillar Score | Severity | Rationale |
|--------------|----------|-----------|
| Score 1 | **P1** | Severe UX issue impacting users |
| Score 2 | **P2** | Medium issue, should address |
| Score 3 | **P3** | Minor issue, consider fixing |
| Score 4 | **None** | No finding needed |

---

## Confidence Calibration

Reviewer confidence in UI findings should account for:

1. **Direct code evidence** — grep hits for specific patterns (high confidence)
2. **Inference** — Best-practice extrapolation (medium confidence)
3. **Screenshot-based** — Visual assessment without code audit (lower confidence)

### Confidence Ranges

| Evidence Type | Typical Confidence |
|---------------|-------------------|
| Code grep match (e.g., hardcoded color) | 0.75-0.95 |
| File exists check (e.g., error boundary) | 0.60-0.80 |
| Screenshot visual assessment | 0.50-0.70 |
| Pattern inference | 0.40-0.60 |

---

## AutofixClass Mapping for UI Issues

UI issues typically map to `manual` since they require design decisions:

| Issue Type | AutofixClass |
|------------|--------------|
| Generic copy | `manual` (requires writer) |
| Missing UX states | `gated_auto` (can add skeleton, but design needed) |
| Hardcoded colors | `safe_auto` (can replace with tokens) |
| Arbitrary spacing | `safe_auto` (can normalize to scale) |
| Typography inconsistencies | `gated_auto` (needs design review) |

---

## Pillar Weighting

Overall UI score is sum of pillar scores (max 24):

| Grade | Score Range | Interpretation |
|-------|-------------|----------------|
| A | 20-24 | Excellent UI implementation |
| B | 16-19 | Good, minor issues |
| C | 12-15 | Needs work |
| D | 8-11 | Significant problems |
| F | <8 | Poor implementation |

---

## Calibration Check

Before finalizing UI audit, verify:

- [ ] Each pillar score has file:line evidence
- [ ] Scores are consistent across pillars (no 4 and 1 for similar issues)
- [ ] Top 3 fixes are actionable (specific file + specific change)
- [ ] Total score matches individual pillar sum
