/**
 * Layered Context System - Type Definitions
 *
 * A structured context management system that preserves historical execution
 * traces for LLM reasoning across phases and milestones.
 */

// ─── Layer Names ───────────────────────────────────────────────────────────────

export type ContextLayerName =
  | 'working'
  | 'recent_history'
  | 'project_memory'
  | 'session';

// ─── Context Kind ─────────────────────────────────────────────────────────────

/**
 * The semantic kind of a context entry.
 * Used for querying and LLM reference.
 */
export enum ContextKind {
  /** A decision made with rationale */
  Decision = 'decision',
  /** Research findings from a research phase */
  Research = 'research',
  /** Plan execution result (success/failure) */
  PlanOutcome = 'plan_outcome',
  /** Individual task completion */
  TaskResult = 'task_result',
  /** Gap found during verification */
  GapFound = 'gap_found',
  /** Stated assumption */
  Assumption = 'assumption',
  /** Technology/stack decision */
  TechChoice = 'tech_choice',
  /** Requirement captured */
  Requirement = 'requirement',
  /** Error encountered */
  Error = 'error',
  /** Tool use summary */
  ToolSummary = 'tool_summary',
  /** Project state snapshot */
  State = 'state',
}

// ─── Context Importance ───────────────────────────────────────────────────────

/**
 * Importance level for context entries.
 * Used for pruning when token budget is constrained.
 */
export enum ContextImportance {
  /** Must not prune (e.g., architectural decisions) */
  Critical = 3,
  /** Prefer to keep (e.g., phase outputs) */
  High = 2,
  /** Default priority */
  Medium = 1,
  /** Prune first (e.g., verbose traces) */
  Low = 0,
}

// ─── Core Interfaces ──────────────────────────────────────────────────────────

/**
 * Single context entry - the atomic unit of layered context.
 * Not just markdown: structured, queriable, prunable.
 */
export interface ContextEntry {
  /** Unique identifier for this entry */
  id: string;
  /** Semantic kind - for querying and LLM reference */
  kind: ContextKind;
  /** Human-readable summary (suitable for LLM reference) */
  summary: string;
  /** Full content - markdown or structured data */
  content: string;
  /** Which layer this entry belongs to */
  layer: ContextLayerName;
  /** Phase number when this entry was created (e.g., "01", "02.1") */
  phaseNumber?: string;
  /** Which step within the phase (discuss, research, plan, execute, verify) */
  step?: string;
  /** When this entry was created */
  createdAt: string;
  /** Importance for pruning decisions */
  importance: ContextImportance;
  /** Topics/keywords for semantic query */
  topics: string[];
  /** Provenance - which context files/inputs fed into this entry */
  provenance: string[];
  /** Parent entry ID if this was derived from another entry */
  derivedFrom?: string;
  /** Token estimate for this entry */
  tokenEstimate?: number;
}

/**
 * A context layer - a collection of entries with size limits.
 */
export interface ContextLayer {
  name: ContextLayerName;
  entries: ContextEntry[];
  maxEntries: number;
  /** null = no expiry */
  maxAgeMs: number | null;
  createdAt: string;
  lastAccessedAt: string;
}

/**
 * Query for retrieving relevant context entries.
 * All filters are ANDed together.
 */
export interface ContextQuery {
  /** Match entries by kind */
  kinds?: ContextKind[];
  /** Match entries by topic (any match) */
  topics?: string[];
  /** Match entries from specific phase(s) */
  phases?: string[];
  /** Match entries from specific step(s) */
  steps?: string[];
  /** Match entries at or above this importance */
  minImportance?: ContextImportance;
  /** Maximum number of entries to return */
  limit?: number;
  /** Sort by: "recency" | "importance" | "kind". Default: recency */
  sortBy?: 'recency' | 'importance' | 'kind';
  /** Include entries derived from this entry ID */
  derivedFrom?: string;
  /** Free-text search in summary and content */
  search?: string;
  /** Filter to specific layer only */
  layer?: ContextLayerName;
}

/**
 * Result of a context query - entries plus metadata.
 */
export interface ContextQueryResult {
  entries: ContextEntry[];
  totalReturned: number;
  totalAvailable: number;
  truncated: boolean;
  query: ContextQuery;
}

/**
 * Summary of a layer for token budgeting and reporting.
 */
export interface ContextLayerSummary {
  name: ContextLayerName;
  entryCount: number;
  estimatedTokens: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  kindCounts: Record<string, number>;
  topTopics: string[];
}

/**
 * Full context summary for a milestone/session.
 */
export interface ContextSummary {
  layers: ContextLayerSummary[];
  totalEntries: number;
  totalEstimatedTokens: number;
  phasesCovered: string[];
  recentDecisions: ContextEntry[];
  recentGaps: ContextEntry[];
  pendingQuestions: string[];
}

/**
 * Configuration for a single layer.
 */
export interface LayerConfig {
  maxEntries: number;
  /** null = no expiry */
  maxAgeMs: number | null;
}

/**
 * Configuration for the LayeredContextManager.
 */
export interface LayeredContextManagerConfig {
  working?: LayerConfig;
  recentHistory?: LayerConfig;
  projectMemory?: LayerConfig;
  session?: LayerConfig;
  /** Max tokens for all layers combined before summarization kicks in */
  maxTotalTokens?: number;
  /** Compress entries older than this when summarizing. Default: 3 phases ago */
  compressAfterPhases?: number;
}

// ─── Default Configuration ────────────────────────────────────────────────────

export const DEFAULT_LAYER_CONFIGS: Record<ContextLayerName, LayerConfig> = {
  working: { maxEntries: 50, maxAgeMs: 30 * 60 * 1000 },        // 30 min
  recent_history: { maxEntries: 200, maxAgeMs: 24 * 60 * 60 * 1000 }, // 24 hours
  project_memory: { maxEntries: 500, maxAgeMs: null },              // Permanent
  session: { maxEntries: 100, maxAgeMs: 60 * 60 * 1000 },       // 1 hour
};

// ─── Persistence Types ────────────────────────────────────────────────────────

/**
 * Serialized project memory for disk persistence.
 */
export interface ProjectMemoryPersistence {
  version: 1;
  entries: ContextEntry[];
  lastUpdated: string;
}

/**
 * Serialized recent history for disk persistence.
 */
export interface RecentHistoryPersistence {
  version: 1;
  entries: ContextEntry[];
  milestoneId: string;
  lastUpdated: string;
}
