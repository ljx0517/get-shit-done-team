/**
 * Skill: step-skip-decider
 *
 * Determines which phase lifecycle steps should run, skip, or run in alternate
 * modes based on phase state and workflow configuration.
 *
 * Decouples step execution decisions from hardcoded PhaseRunner logic.
 */

import type { PhaseOpInfo } from './types.js';
import type { WorkflowConfig } from './config.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StepType = 'discuss' | 'research' | 'plan' | 'plan_check' | 'execute' | 'verify' | 'advance';
export type StepAction = 'run' | 'skip' | 'self_discuss';

export interface PreviousStepResult {
  step: StepType;
  success: boolean;
  hasContextAfter: boolean;
}

export interface StepSkipInput {
  phaseOp: Pick<PhaseOpInfo, 'has_context' | 'has_plans' | 'plan_count' | 'has_research' | 'has_verification'>;
  config: Pick<WorkflowConfig, 'skip_discuss' | 'auto_advance' | 'research' | 'plan_check' | 'verifier'>;
  previousStepResults: PreviousStepResult[];
  currentStep: StepType;
}

export interface StepSkipDecision {
  action: StepAction;
  reason: string;
  blockers: string[];
  reEvaluate: boolean;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function and(...conditions: boolean[]): boolean {
  return conditions.every(Boolean);
}

function or(...conditions: boolean[]): boolean {
  return conditions.some(Boolean);
}

function not(value: boolean): boolean {
  return !value;
}

// ─── Decision Functions ─────────────────────────────────────────────────────

/**
 * Decide whether to run, skip, or self-discuss for the Discuss step.
 */
function decideDiscuss(input: StepSkipInput): StepSkipDecision {
  const { phaseOp, config } = input;
  const { has_context } = phaseOp;
  const { skip_discuss, auto_advance } = config;

  // Case 1: Context exists - skip discuss
  if (has_context) {
    return {
      action: 'skip',
      reason: `Context already exists at ${phaseOp.has_context ? 'has_context=true' : 'no context'}, discuss step unnecessary`,
      blockers: [],
      reEvaluate: false,
    };
  }

  // Case 2: Auto mode with no context - run self-discuss
  if (not(has_context) && not(skip_discuss) && auto_advance) {
    return {
      action: 'self_discuss',
      reason: 'Auto mode with no context: run self-discuss to generate context autonomously',
      blockers: [],
      reEvaluate: true, // Re-query phaseOp to check if context was created
    };
  }

  // Case 3: Skip flag set with no context in auto mode - still self-discuss
  if (not(has_context) && skip_discuss && auto_advance) {
    return {
      action: 'self_discuss',
      reason: 'Auto mode: override skip_discuss to generate context via self-discuss',
      blockers: [],
      reEvaluate: true,
    };
  }

  // Case 4: Normal discuss mode (manual, no context, no skip)
  if (not(has_context) && not(skip_discuss) && not(auto_advance)) {
    return {
      action: 'run',
      reason: 'Normal discuss mode with human gate',
      blockers: [],
      reEvaluate: true,
    };
  }

  // Case 5: Skip flag set but context exists - skip
  if (has_context && skip_discuss) {
    return {
      action: 'skip',
      reason: 'Both skip flag and context present, skip discuss',
      blockers: [],
      reEvaluate: false,
    };
  }

  // Case 6: Skip flag set with no auto_advance - skip
  if (skip_discuss && not(auto_advance) && not(has_context)) {
    return {
      action: 'skip',
      reason: 'skip_discuss=true and no auto_advance, skip discuss step',
      blockers: [],
      reEvaluate: false,
    };
  }

  // Default fallback - run
  return {
    action: 'run',
    reason: 'Default: run discuss step',
    blockers: [],
    reEvaluate: true,
  };
}

/**
 * Decide for the Research step.
 */
function decideResearch(input: StepSkipInput): StepSkipDecision {
  const { config } = input;

  if (not(config.research)) {
    return {
      action: 'skip',
      reason: 'Research step disabled in workflow config',
      blockers: [],
      reEvaluate: false,
    };
  }

  return {
    action: 'run',
    reason: 'Research enabled per workflow config',
    blockers: [],
    reEvaluate: false,
  };
}

/**
 * Decide for the Plan step - always runs.
 */
function decidePlan(_input: StepSkipInput): StepSkipDecision {
  return {
    action: 'run',
    reason: 'Plan step is required - creates execution roadmap',
    blockers: [],
    reEvaluate: true, // Re-query to check if plans were created
  };
}

/**
 * Decide for the Plan Check step.
 */
function decidePlanCheck(input: StepSkipInput): StepSkipDecision {
  const { config } = input;

  if (not(config.plan_check)) {
    return {
      action: 'skip',
      reason: 'Plan check disabled in workflow config',
      blockers: [],
      reEvaluate: false,
    };
  }

  return {
    action: 'run',
    reason: 'Plan verification enabled',
    blockers: [],
    reEvaluate: false,
  };
}

/**
 * Decide for the Execute step - always runs.
 */
function decideExecute(input: StepSkipInput): StepSkipDecision {
  const { phaseOp } = input;

  if (phaseOp.plan_count === 0 || not(phaseOp.has_plans)) {
    return {
      action: 'run',
      reason: 'Execute step required - no plans yet, will be created',
      blockers: [],
      reEvaluate: false,
    };
  }

  return {
    action: 'run',
    reason: 'Execute step is required for phase completion',
    blockers: [],
    reEvaluate: false,
  };
}

/**
 * Decide for the Verify step.
 */
function decideVerify(input: StepSkipInput): StepSkipDecision {
  const { config } = input;

  if (not(config.verifier)) {
    return {
      action: 'skip',
      reason: 'Verifier disabled in workflow config',
      blockers: [],
      reEvaluate: false,
    };
  }

  return {
    action: 'run',
    reason: 'Verification enabled per workflow config',
    blockers: [],
    reEvaluate: false,
  };
}

/**
 * Decide for the Advance step.
 * Always returns 'run' - the actual advance/halt logic is handled
 * in runAdvanceStep which invokes callbacks or auto-approves when no callback.
 */
function decideAdvance(input: StepSkipInput): StepSkipDecision {
  return {
    action: 'run',
    reason: 'Advance step is always run - callbacks or auto-approve handle human confirmation',
    blockers: [],
    reEvaluate: false,
  };
}

// ─── Main Decision Function ──────────────────────────────────────────────────

/**
 * Main entry point - decide what action to take for the current step.
 *
 * @param input - StepSkipInput with phaseOp, config, previous results, and current step
 * @returns StepSkipDecision with action, reason, blockers, and reEvaluate flag
 *
 * @example
 * ```typescript
 * const decision = await StepSkipDecider.decide({
 *   phaseOp,
 *   config: config.workflow,
 *   previousStepResults: [],
 *   currentStep: 'discuss',
 * });
 *
 * if (decision.action === 'skip') {
 *   logger.debug(`Skipping discuss: ${decision.reason}`);
 * } else if (decision.action === 'self_discuss') {
 *   await runSelfDiscussStep();
 * } else {
 *   await runDiscussStep();
 * }
 * ```
 */
export function decide(input: StepSkipInput): StepSkipDecision {
  switch (input.currentStep) {
    case 'discuss':
      return decideDiscuss(input);
    case 'research':
      return decideResearch(input);
    case 'plan':
      return decidePlan(input);
    case 'plan_check':
      return decidePlanCheck(input);
    case 'execute':
      return decideExecute(input);
    case 'verify':
      return decideVerify(input);
    case 'advance':
      return decideAdvance(input);
    default:
      // Unknown step type - default to run for safety
      return {
        action: 'run',
        reason: `Unknown step type: ${input.currentStep}, defaulting to run`,
        blockers: [],
        reEvaluate: false,
      };
  }
}

/**
 * Get blockers based on step results and config.
 * Returns decision guidance for how to handle blockers.
 */
export function getBlockerGuidance(
  step: StepType,
  hasContextAfter: boolean,
  hasPlansAfter: boolean,
  planCount: number,
  config: Pick<WorkflowConfig, 'auto_advance'>
): { decision: 'retry' | 'skip' | 'stop'; reason: string } {
  switch (step) {
    case 'discuss':
      if (not(hasContextAfter)) {
        if (config.auto_advance) {
          return { decision: 'skip', reason: 'Auto mode: proceed without context' };
        }
        return { decision: 'stop', reason: 'Manual mode: human decides' };
      }
      break;

    case 'plan':
      if (not(hasPlansAfter) || planCount === 0) {
        if (config.auto_advance) {
          return { decision: 'retry', reason: 'Auto mode: re-plan once' };
        }
        return { decision: 'stop', reason: 'Manual mode: human decides' };
      }
      break;

    case 'verify':
      // Verification gaps are handled separately in runVerifyStep gap closure cycle
      break;
  }

  // Default
  return { decision: 'skip', reason: 'Default: skip blocker' };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const StepSkipDecider = {
  decide,
  getBlockerGuidance,
};
