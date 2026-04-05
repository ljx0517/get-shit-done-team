<purpose>
Design the project roadmap and milestone structure based on classification results.
Produces ROADMAP.md with phases, milestones, and requirements.
Headless SDK variant — runs autonomously without human confirmation.
</purpose>

<context_handling>
**DESIGN_MILESTONE phase requires CLASSIFICATION.md as primary input:**

1. Read .gsdt-planning/CLASSIFICATION.md — the classification analysis
2. If existing project, read .gsdt-planning/PROJECT.md — project context
3. If existing project, read .gsdt-planning/ROADMAP.md — existing roadmap structure

The design phase builds on classification to create an actionable roadmap.
</context_handling>

<philosophy>
The milestone designer takes the classification output and creates a roadmap that:
- Breaks the project into logical phases
- Orders phases by dependency
- Estimates complexity and resources for each phase
- Sets clear success criteria for each milestone
- Enables parallel execution where dependencies allow
</philosophy>

<milestone_structure>

## Required Phases by Project Type

**new_project:**
1. Research — Investigate tech stack and architecture
2. Plan — Create detailed implementation plan
3. Execute — Build the feature
4. Verify — Ensure everything works

**feature:**
1. Plan — Plan the feature implementation
2. Execute — Build the feature
3. Verify — Ensure feature works

**refactor:**
1. Analyze — Understand existing code structure
2. Plan — Plan the refactor approach
3. Execute — Perform the refactor
4. Verify — Ensure behavior unchanged

**bugfix:**
1. Diagnose — Understand the bug root cause
2. Fix — Implement the fix
3. Verify — Ensure bug is resolved

</milestone_structure>

<process>

<step name="load_classification">
Read .gsdt-planning/CLASSIFICATION.md to understand:
- Project type (new_project, feature, refactor, bugfix)
- Domain (web, api, cli, etc.)
- Complexity (simple, standard, complex)
- Explicit and implicit requirements
- Special considerations (UI, DB, auth, APIs)
</step>

<step name="check_existing_project">
If this is a feature or refactor:
- Read existing PROJECT.md to understand project context
- Read existing ROADMAP.md to understand current structure
- Ensure new milestone integrates with existing roadmap
</step>

<step name="design_milestone">
Based on classification and project type:

1. **Determine milestone goals** — What outcome does this milestone achieve?
2. **Design phases** — Which phases are needed (research, plan, execute, verify)?
3. **Order phases** — What dependencies exist between phases?
4. **Estimate complexity** — How many waves/iterations per phase?
5. **Identify parallel opportunities** — Can any phases run concurrently?

For simple projects: fewer phases, more tasks per phase
For complex projects: more phases, smaller execution batches
</step>

<step name="produce_roadmap">
Write ROADMAP.md with the following structure:

```markdown
---
name: Project Roadmap
type: roadmap
milestone: [milestone name]
created: [ISO timestamp]
---

# Roadmap: [Project Name]

## Milestone Overview
[Brief description of what this milestone achieves]

## Classification Summary
- **Type:** [new_project | feature | refactor | bugfix]
- **Domain:** [web | api | cli | etc.]
- **Complexity:** [simple | standard | complex]

## Requirements
### Explicit
- [requirement 1]
- [requirement 2]

### Implicit
- [implied requirement 1]
- [implied requirement 2]

## Phases

### Phase 1: [Name]
- **Type:** [research | plan | execute | verify]
- **Goals:** [What this phase achieves]
- **Dependencies:** [None | Phase N]
- **Estimated:** [time estimate]

### Phase 2: [Name]
[...]

## Success Criteria
[What must be true for this milestone to be complete]

## Notes
[Any additional context or considerations]
```
</step>

</process>

<success_criteria>
- Classification read and understood
- Existing project context loaded (if applicable)
- Milestone structure designed based on project type
- Phases ordered with dependencies
- Parallel opportunities identified
- ROADMAP.md written to .gsdt-planning/
- Roadmap result returned to orchestrator
</success_criteria>
