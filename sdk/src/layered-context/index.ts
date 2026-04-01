/**
 * Layered Context System
 *
 * A structured context management system that preserves historical execution
 * traces for LLM reasoning across phases and milestones.
 *
 * @example
 * ```typescript
 * import { LayeredContextManager, ContextKind, ContextImportance } from './layered-context/index.js';
 *
 * const manager = new LayeredContextManager('/path/to/project');
 *
 * // Push a decision
 * manager.pushDecision(
 *   'Chose PostgreSQL over MongoDB',
 *   'PostgreSQL chosen for ACID compliance on auth data',
 *   '01',
 *   ['database', 'auth', 'architecture'],
 *   ['RESEARCH.md', 'CONTEXT.md']
 * );
 *
 * // Query for decisions about a topic
 * const decisions = manager.getDecisions({ topic: 'auth' });
 *
 * // Get LLM-ready context
 * const llmContext = manager.getLLMContext({
 *   kinds: [ContextKind.Decision, ContextKind.TechChoice],
 *   minImportance: ContextImportance.High,
 *   limit: 15,
 * });
 * ```
 */

export {
  LayeredContextManager,
} from './LayeredContextManager.js';

export {
  ContextKind,
  ContextImportance,
  DEFAULT_LAYER_CONFIGS,
  type ContextLayerName,
  type ContextEntry,
  type ContextLayer,
  type ContextQuery,
  type ContextQueryResult,
  type ContextSummary,
  type ContextLayerSummary,
  type LayerConfig,
  type LayeredContextManagerConfig,
  type ProjectMemoryPersistence,
  type RecentHistoryPersistence,
} from './types.js';
