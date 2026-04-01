# Skill: phase-instructions

## Purpose

Provides phase-specific instructions that guide agent behavior during each phase lifecycle. These instructions complement the workflow file by giving agents explicit guidance on what to do and how to approach each phase type.

## Triggers

When building prompts for a phase, before calling the agent:
- PhaseRunner assembles the prompt with workflow + agent + instructions
- ContextEngine resolves context files for the phase
- PhaseInstructions provides the "how to approach this phase" guidance

## Input Schema

```typescript
interface PhaseInstructionsInput {
  phaseType: PhaseType;
  context?: {
    is_new_project?: boolean;
    complexity?: 'low' | 'medium' | 'high';
    has_existing_context?: boolean;
  };
}
```

## Output Schema

```typescript
interface PhaseInstructionsOutput {
  instruction: string;    // Primary instruction for the phase
  tips: string[];        // Helpful tips for this phase
  examples: string[];    // Example outputs or approaches
}
```

## Decision Rules

### Phase Instructions

| Phase | Instruction | Tips |
|-------|------------|------|
| Classify | Analyze input to determine project type, domain, complexity. Extract explicit/implicit requirements. Produce CLASSIFICATION.md. | Read PROJECT.md if exists. Use structured analysis format. |
| DesignMilestone | Design roadmap based on classification. Create ROADMAP.md with phases, milestones. Use goal-backward methodology. | Start from desired outcome. Break down into achievable milestones. |
| Research | Technical investigation only. Do NOT modify source files. Produce RESEARCH.md with findings, confidence levels (HIGH/MEDIUM/LOW), recommendations. | Focus on feasibility. Identify risks early. |
| Plan | Create executable plans with task breakdown, dependency analysis, verification criteria. Each task needs acceptance criteria. | Use goal-backward: start from end state. |
| Verify | Verify goal achievement, not just task completion. Start from what phase SHOULD deliver, verify it exists and works. Produce VERIFICATION.md. | Be rigorous. Check edge cases. |
| Discuss | Extract implementation decisions downstream agents need. Identify gray areas, capture decisions guiding research/planning. | Be opinionated when data is insufficient. |
| Execute | No additional instructions (null). | Use task list from plan. |
| Default | null | N/A |

### Context Modifiers

- `is_new_project: false` → Add "If project exists, read existing context first"
- `complexity: high` → Add "Allow extra time for thorough investigation"
- `has_existing_context: true` → Add "Use existing context, don't regenerate"

## Usage

```typescript
import { getPhaseInstructions } from './phase-instructions.js';

// Get instructions for a phase
const { instruction, tips, examples } = getPhaseInstructions(PhaseType.Research);

// With context modifiers
const result = getPhaseInstructions(PhaseType.Plan, {
  is_new_project: false,
  complexity: 'high',
});
```

## Design Rationale

- **Decoupled**: Phase instruction logic lives in the skill, not in PhasePrompt
- **Extensible**: Easy to add new phases or modify instructions without touching multiple files
- **Context-aware**: Instructions can adapt based on project state and complexity
- **AI-friendly**: Structured output (instruction + tips + examples) is easy for AI to consume
