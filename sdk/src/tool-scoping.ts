/**
 * Tool scoping — maps phase types to allowed tool sets.
 *
 * Per R015, different phases get different tool access:
 * - Research: read-only + web search (no Write/Edit on source)
 * - Execute: full read/write
 * - Verify: read-only (no Write/Edit)
 * - Discuss: read-only
 * - Plan: read/write + web (for creating plan files)
 *
 * @deprecated Use tool-scope-resolver.ts instead. This file re-exports
 * from tool-scope-resolver for backward compatibility.
 */

// Re-export from skill for backward compatibility
export { PHASE_DEFAULT_TOOLS, PHASE_AGENT_MAP, getToolsForPhase } from './tool-scope-resolver.js';
