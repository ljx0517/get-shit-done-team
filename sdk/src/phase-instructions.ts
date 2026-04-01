/**
 * Skill: phase-instructions
 *
 * Provides phase-specific instructions that guide agent behavior during each phase.
 * Complements workflow files with explicit guidance on what to do and how to approach.
 *
 * Decouples instruction logic from hardcoded PhasePrompt.
 */

import { PhaseType } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhaseInstructionsInput {
  phaseType: PhaseType;
  context?: {
    is_new_project?: boolean;
    complexity?: 'low' | 'medium' | 'high';
    has_existing_context?: boolean;
  };
}

export interface PhaseInstructionsOutput {
  instruction: string;
  tips: string[];
  examples: string[];
}

// ─── Phase instruction definitions ─────────────────────────────────────────────

interface PhaseInstructionDef {
  instruction: string;
  tips: string[];
  examples: string[];
}

const PHASE_INSTRUCTIONS: Record<PhaseType, PhaseInstructionDef | null> = {
  [PhaseType.Classify]: {
    instruction:
      'Analyze the user input to determine project type, domain, and complexity. Extract explicit and implicit requirements. Produce CLASSIFICATION.md with structured analysis. If a project already exists, read PROJECT.md to understand current context.',
    tips: [
      'Read PROJECT.md first if the project already exists',
      'Use structured analysis format with clear sections',
      'Identify both stated and unstated requirements',
    ],
    examples: [
      'CLASSIFICATION.md: domain=web-app, type=new-project, complexity=medium',
      'Keywords: blog, markdown, auth',
    ],
  },

  [PhaseType.DesignMilestone]: {
    instruction:
      'Design the project roadmap based on classification results. Create ROADMAP.md with phases, milestones, and requirements. Use goal-backward methodology starting from the desired outcome.',
    tips: [
      'Start from the desired end outcome',
      'Break down into achievable milestones',
      'Consider dependencies between phases',
    ],
    examples: [
      'ROADMAP.md with phases: Research → Plan → Execute → Verify',
      'Milestone 1: MVP with core features',
    ],
  },

  [PhaseType.Research]: {
    instruction:
      'Focus on technical investigation. Do not modify source files. Produce RESEARCH.md with findings organized by topic, confidence levels (HIGH/MEDIUM/LOW), and specific recommendations.',
    tips: [
      'Investigate feasibility thoroughly',
      'Identify technical risks early',
      'Provide actionable recommendations',
    ],
    examples: [
      'RESEARCH.md: Tech stack analysis with confidence levels',
      'Recommendation: Use Next.js for SSR support',
    ],
  },

  [PhaseType.Plan]: {
    instruction:
      'Create executable plans with task breakdown, dependency analysis, and verification criteria. Each task must have clear acceptance criteria and a done condition.',
    tips: [
      'Use goal-backward methodology',
      'Each task needs clear acceptance criteria',
      'Identify task dependencies early',
    ],
    examples: [
      'plan.md: Task breakdown with dependencies',
      'Task: Implement auth - done when login/logout works',
    ],
  },

  [PhaseType.Verify]: {
    instruction:
      'Verify goal achievement, not just task completion. Start from what the phase SHOULD deliver, then verify it actually exists and works. Produce VERIFICATION.md with pass/fail for each criterion.',
    tips: [
      'Be rigorous in verification',
      'Check edge cases and error conditions',
      'Verify artifacts actually exist and work',
    ],
    examples: [
      'VERIFICATION.md: [PASS] Login works, [FAIL] Logout redirects incorrectly',
    ],
  },

  [PhaseType.Discuss]: {
    instruction:
      'Extract implementation decisions that downstream agents need. Identify gray areas, capture decisions that guide research and planning.',
    tips: [
      'Be opinionated when data is insufficient',
      'Capture the "why" behind decisions',
      'Identify trade-offs explicitly',
    ],
    examples: [
      'Decision: Use PostgreSQL over MongoDB - better ACID compliance for transactions',
    ],
  },

  [PhaseType.Execute]: null,
};

// ─── Context modifiers ────────────────────────────────────────────────────────

function applyContextModifiers(
  def: PhaseInstructionDef | null,
  context?: PhaseInstructionsInput['context']
): PhaseInstructionsOutput {
  if (!def) {
    return { instruction: '', tips: [], examples: [] };
  }

  let instruction = def.instruction;
  let tips = [...def.tips];
  let examples = [...def.examples];

  if (context) {
    if (context.is_new_project === false) {
      tips.push('If project exists, read existing context first before making changes');
    }

    if (context.complexity === 'high') {
      tips.push('Allow extra time for thorough investigation and testing');
    }

    if (context.has_existing_context) {
      tips.push('Use existing context, do not regenerate duplicate artifacts');
    }
  }

  return { instruction, tips, examples };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Get phase-specific instructions for a phase type.
 *
 * @param phaseType - The phase type
 * @param context - Optional context modifiers
 * @returns PhaseInstructionsOutput with instruction, tips, and examples
 */
export function getPhaseInstructions(
  phaseType: PhaseType,
  context?: PhaseInstructionsInput['context']
): PhaseInstructionsOutput {
  const def = PHASE_INSTRUCTIONS[phaseType] ?? null;
  return applyContextModifiers(def, context);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const PhaseInstructions = {
  getPhaseInstructions,
};
