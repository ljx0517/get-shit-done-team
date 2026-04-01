/**
 * Skill: tool-scope-resolver
 *
 * Resolves which tools are available for each phase type.
 * Enforces tool access control per R015.
 *
 * Decouples tool scoping decisions from hardcoded PhaseRunner logic.
 */

import { PhaseType } from './types.js';
import { parseAgentTools } from './prompt-builder.js';

// ─── Phase default tool sets ─────────────────────────────────────────────────

/**
 * Default tools for each phase type.
 * Per R015, different phases get different tool access.
 */
export const PHASE_DEFAULT_TOOLS: Record<PhaseType, string[]> = {
  [PhaseType.Classify]: ['Read', 'Bash', 'Grep', 'Glob'],
  [PhaseType.DesignMilestone]: ['Read', 'Write', 'Bash', 'Glob', 'Grep'],
  [PhaseType.Research]: ['Read', 'Grep', 'Glob', 'Bash', 'WebSearch'],
  [PhaseType.Execute]: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
  [PhaseType.Verify]: ['Read', 'Bash', 'Grep', 'Glob'],
  [PhaseType.Discuss]: ['Read', 'Bash', 'Grep', 'Glob'],
  [PhaseType.Plan]: ['Read', 'Write', 'Bash', 'Glob', 'Grep', 'WebFetch'],
};

// ─── Phase → agent definition mapping ──────────────────────────────────────

/**
 * Maps each phase type to its corresponding agent definition filename.
 * Discuss has no dedicated agent — it runs in the main conversation.
 */
export const PHASE_AGENT_MAP: Record<PhaseType, string | null> = {
  [PhaseType.Classify]: 'gsdt-classifier.md',
  [PhaseType.DesignMilestone]: 'gsdt-roadmapper.md',
  [PhaseType.Execute]: 'gsdt-executor.md',
  [PhaseType.Research]: 'gsdt-phase-researcher.md',
  [PhaseType.Plan]: 'gsdt-planner.md',
  [PhaseType.Verify]: 'gsdt-verifier.md',
  [PhaseType.Discuss]: null,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolScopeInput {
  phaseType: PhaseType;
  agentDef?: string;
  context?: {
    has_write_access?: boolean;
    is_experimental?: boolean;
  };
}

export interface ToolScopeOutput {
  tools: string[];
  reason: string;
  restrictions: string[];
}

// ─── Core Resolution Logic ───────────────────────────────────────────────────

/**
 * Get the allowed tools for a phase type.
 *
 * If an agent definition string is provided, tools are parsed from its
 * frontmatter (reusing parseAgentTools from prompt-builder). Otherwise,
 * returns the hardcoded phase defaults per R015.
 *
 * @param phaseType - The phase being executed
 * @param agentDef - Optional raw agent .md file content to parse tools from
 * @returns Array of allowed tool names
 */
export function getToolsForPhase(phaseType: PhaseType, agentDef?: string): string[] {
  if (agentDef) {
    return parseAgentTools(agentDef);
  }
  return [...PHASE_DEFAULT_TOOLS[phaseType]];
}

/**
 * Apply context-based restrictions to tool list.
 *
 * @param tools - Base tool list
 * @param context - Context with restrictions
 * @returns Filtered tool list
 */
function applyRestrictions(tools: string[], context?: { has_write_access?: boolean }): string[] {
  if (!context) return tools;

  // If write access is disabled, remove Write and Edit tools
  if (context.has_write_access === false) {
    return tools.filter(t => t !== 'Write' && t !== 'Edit');
  }

  return tools;
}

/**
 * Resolve tools with full context.
 *
 * @param input - ToolScopeInput with phaseType, optional agentDef, and context
 * @returns ToolScopeOutput with tools, reason, and restrictions
 */
export function resolveToolScope(input: ToolScopeInput): ToolScopeOutput {
  const { phaseType, agentDef, context } = input;

  // Determine base tools
  let tools: string[];
  let reason: string;
  let restrictions: string[] = [];

  if (agentDef) {
    tools = parseAgentTools(agentDef);
    reason = `Parsed tools from agent definition for ${phaseType}`;
  } else {
    tools = [...PHASE_DEFAULT_TOOLS[phaseType]];
    reason = `Using default tools for ${phaseType} phase per R015`;
  }

  // Apply context restrictions
  if (context?.has_write_access === false) {
    tools = tools.filter(t => t !== 'Write' && t !== 'Edit');
    restrictions.push('No Write/Edit (has_write_access=false)');
  }

  return { tools, reason, restrictions };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const ToolScopeResolver = {
  PHASE_DEFAULT_TOOLS,
  PHASE_AGENT_MAP,
  getToolsForPhase,
  resolveToolScope,
};
