# Skill: step-skip-decider

## Purpose

Determines which phase lifecycle steps should run, skipped, or run in alternate modes based on phase state and workflow configuration.

## Triggers

When the PhaseRunner needs to decide whether to run each step:
- Before each step execution in the lifecycle: discuss → research → plan → plan_check → execute → verify → advance
- After a step completes, when re-evaluating subsequent steps

## Input Schema

```typescript
interface StepSkipInput {
  phaseOp: {
    has_context: boolean;      // Phase has existing CONTEXT.md
    has_plans: boolean;       // Phase has existing plans
    plan_count: number;        // Number of plans
    has_research: boolean;     // Phase has existing research
    has_verification: boolean; // Phase has verification output
  };
  config: {
    skip_discuss: boolean;     // Explicit skip flag from workflow config
    auto_advance: boolean;     // Auto mode - no human gates
    research: boolean;         // Enable research step
    plan_check: boolean;      // Enable plan checker
    verifier: boolean;        // Enable verifier
  };
  previousStepResults: Array<{
    step: string;
    success: boolean;
    has_context_after: boolean; // Whether step created context
  }>;
  currentStep: 'discuss' | 'research' | 'plan' | 'plan_check' | 'execute' | 'verify' | 'advance';
}
```

## Output Schema

```typescript
interface StepSkipOutput {
  decision: {
    action: 'run' | 'skip' | 'self_discuss';
    reason: string;           // Human-readable explanation
    blockers: string[];       // Any blocking issues
  };
  reEvaluate: boolean;       // Whether to re-query phaseOp after this step
}
```

## Decision Rules

### Discuss Step

| Condition | Action | Reason |
|-----------|--------|--------|
| `has_context == true` | **skip** | "Context already exists, discuss step unnecessary" |
| `skip_discuss == true` AND `has_context == false` AND `auto_advance == true` | **self_discuss** | "Auto mode with no context: run self-discuss to generate context autonomously" |
| `has_context == false` AND `skip_discuss == false` AND `auto_advance == false` | **run** | "Normal discuss mode with human gate" |
| `has_context == false` AND `skip_discuss == false` AND `auto_advance == true` | **self_discuss** | "Auto mode: run self-discuss instead of waiting for human" |
| `skip_discuss == true` AND `has_context == true` | **skip** | "Both skip flag and context present, skip discuss" |

**Key insight**: The `shouldSkip` flag is `has_context || skip_discuss`, but auto_advance can override even when shouldSkip is true IF no context exists yet.

### Research Step

| Condition | Action | Reason |
|-----------|--------|--------|
| `config.research == false` | **skip** | "Research step disabled in workflow config" |
| `config.research == true` | **run** | "Research enabled per workflow config" |

### Plan Step

| Condition | Action | Reason |
|-----------|--------|--------|
| (always) | **run** | "Plan step is required - creates execution roadmap" |

Note: If plans already exist (`phaseOp.has_plans == true`), the planner should update/refine rather than create from scratch.

### Plan Check Step

| Condition | Action | Reason |
|-----------|--------|--------|
| `config.plan_check == true` | **run** | "Plan verification enabled" |
| `config.plan_check == false` | **skip** | "Plan check disabled in workflow config" |

### Execute Step

| Condition | Action | Reason |
|-----------|--------|--------|
| (always) | **run** | "Execute step is required for phase completion" |

Note: If all plans have `has_summary == true`, execute should complete quickly (no work to do).

### Verify Step

| Condition | Action | Reason |
|-----------|--------|--------|
| `config.verifier == false` | **skip** | "Verifier disabled in workflow config" |
| `config.verifier == true` | **run** | "Verification enabled per workflow config" |

### Advance Step

| Condition | Action | Reason |
|-----------|--------|--------|
| `config.auto_advance == true` | **run** | "Auto mode: advance automatically after phase complete" |
| `config.auto_advance == false` | **skip** | "Manual mode: require human confirmation to advance" |

## Self-Discuss Mode

When the decision is `self_discuss` (auto mode without existing context):

The runner should:
1. Run a discuss session with AI making decisions autonomously
2. Instruct the AI to identify gray areas and make opinionated choices
3. Write CONTEXT.md with its decisions
4. NOT wait for human confirmation

## Blocker Handling

When a step fails and needs a blocker decision, use this outcome matrix:

| Blocker Type | Auto Mode (`auto_advance=true`) | Manual Mode |
|--------------|--------------------------------|-------------|
| No context after discuss | **skip** (proceed) | **stop** (human decides) |
| No plans after plan | **retry** (re-plan once) | **stop** |
| Verification gaps found | **retry** (gap closure cycle) | **stop** |
| Verification human needed | **accept** (auto-approve) | **callback** |

## Usage

The PhaseRunner calls this skill before each step:

```typescript
const decision = await stepSkipDecider.decide({
  phaseOp,
  config: config.workflow,
  previousStepResults: completedSteps,
  currentStep: 'discuss',
});

if (decision.action === 'skip') {
  logger.debug(`Skipping ${currentStep}: ${decision.reason}`);
} else if (decision.action === 'self_discuss') {
  await runSelfDiscussStep();
} else {
  await runNormalStep();
}
```

## Design Rationale

- **Decoupled**: Step skipping logic lives in the skill, not in PhaseRunner
- **Extensible**: Easy to add new conditions (e.g., `budget_exceeded`, `time_limit`)
- **Consistent**: All skip decisions go through the same skill with clear audit trail
- **Testable**: Each decision rule can be unit tested in isolation
- **AI-friendly**: Skill output is structured JSON, easy for AI to consume and generate
