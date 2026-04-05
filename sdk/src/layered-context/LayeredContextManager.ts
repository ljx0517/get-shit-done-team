/**
 * LayeredContextManager - manages four-layer context system.
 *
 * Coordinates:
 * - working: current phase step
 * - recent_history: previous phase outputs
 * - project_memory: persistent architectural decisions
 * - session: per-execution traces
 */

import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';

import type {
  ContextEntry,
  ContextLayer,
  ContextLayerName,
  ContextQuery,
  ContextQueryResult,
  ContextSummary,
  ContextLayerSummary,
  ContextKind,
  ContextImportance,
  LayeredContextManagerConfig,
  LayerConfig,
  ProjectMemoryPersistence,
  RecentHistoryPersistence,
} from './types.js';
import {
  DEFAULT_LAYER_CONFIGS,
  ContextKind,
  ContextImportance,
} from './types.js';
import { resolvePlanningDir } from '../path-config.js';

// ─── LayeredContextManager ────────────────────────────────────────────────────

export class LayeredContextManager {
  private readonly layers: Map<ContextLayerName, ContextLayer>;
  private readonly config: LayeredContextManagerConfig;
  private readonly projectDir: string;
  private readonly contextDir: string;

  constructor(projectDir: string, config?: Partial<LayeredContextManagerConfig>) {
    this.projectDir = projectDir;
    this.contextDir = join(resolvePlanningDir(projectDir), 'context');
    this.config = { ...config } as LayeredContextManagerConfig;

    this.layers = new Map();

    // Initialize each layer with defaults merged with user config
    for (const layerName of ['working', 'recent_history', 'project_memory', 'session'] as ContextLayerName[]) {
      const layerConfig = this.config[layerName] ?? DEFAULT_LAYER_CONFIGS[layerName];
      this.layers.set(layerName, {
        name: layerName,
        entries: [],
        maxEntries: layerConfig.maxEntries,
        maxAgeMs: layerConfig.maxAgeMs,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      });
    }
  }

  // ─── Entry Management ──────────────────────────────────────────────────────

  /**
   * Push a new entry into a layer.
   * Enforces maxEntries and maxAgeMs limits.
   */
  pushEntry(
    layerName: ContextLayerName,
    entry: Omit<ContextEntry, 'id' | 'createdAt'>,
  ): ContextEntry {
    const layer = this.requireLayer(layerName);

    const fullEntry: ContextEntry = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    layer.entries.push(fullEntry);
    layer.lastAccessedAt = fullEntry.createdAt;

    // Prune if over limits
    this.pruneLayer(layerName);

    return fullEntry;
  }

  /**
   * Push a decision entry to recent_history.
   * Convenience method for PhaseRunner decisions.
   */
  pushDecision(
    summary: string,
    content: string,
    phaseNumber: string,
    topics: string[],
    provenance: string[],
  ): ContextEntry {
    return this.pushEntry('recent_history', {
      kind: ContextKind.Decision,
      summary,
      content,
      phaseNumber,
      importance: ContextImportance.High,
      topics,
      provenance,
    });
  }

  /**
   * Push a tech stack decision to project_memory (permanent).
   */
  pushTechChoice(
    summary: string,
    content: string,
    rationale: string,
    provenance: string[],
  ): ContextEntry {
    return this.pushEntry('project_memory', {
      kind: ContextKind.TechChoice,
      summary,
      content,
      importance: ContextImportance.Critical,
      topics: ['architecture', 'tech-stack', ...this.extractTopics(content)],
      provenance,
    });
  }

  /**
   * Push a plan execution result to recent_history.
   */
  pushPlanOutcome(
    planId: string,
    success: boolean,
    summary: string,
    phaseNumber: string,
    step: string,
    tokensUsed?: number,
  ): ContextEntry {
    const content = JSON.stringify({ planId, success, summary, phaseNumber, step, tokensUsed });
    return this.pushEntry('recent_history', {
      kind: ContextKind.PlanOutcome,
      summary: `[${planId}] ${success ? 'SUCCESS' : 'FAILED'}: ${summary}`,
      content,
      phaseNumber,
      step,
      importance: success ? ContextImportance.Medium : ContextImportance.High,
      topics: ['plan', success ? 'completed' : 'failed'],
      provenance: [planId],
      tokenEstimate: tokensUsed ? Math.ceil(tokensUsed / 4) : undefined,
    });
  }

  /**
   * Push a gap found during verification to recent_history.
   */
  pushGapFound(
    description: string,
    phaseNumber: string,
    affectedPlans: string[],
  ): ContextEntry {
    const content = JSON.stringify({ description, affectedPlans, phaseNumber });
    return this.pushEntry('recent_history', {
      kind: ContextKind.GapFound,
      summary: `Gap: ${description}`,
      content,
      phaseNumber,
      step: 'verify',
      importance: ContextImportance.High,
      topics: ['gap', 'verification'],
      provenance: affectedPlans,
    });
  }

  /**
   * Push a research finding to recent_history.
   */
  pushResearch(
    summary: string,
    content: string,
    phaseNumber: string,
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
    topics: string[],
  ): ContextEntry {
    return this.pushEntry('recent_history', {
      kind: ContextKind.Research,
      summary,
      content,
      phaseNumber,
      step: 'research',
      importance: confidence === 'HIGH' ? ContextImportance.High : ContextImportance.Medium,
      topics,
      provenance: [`research-phase-${phaseNumber}`],
    });
  }

  /**
   * Push an assumption to recent_history.
   */
  pushAssumption(
    summary: string,
    content: string,
    phaseNumber: string,
    topics: string[],
    provenance: string[],
  ): ContextEntry {
    return this.pushEntry('recent_history', {
      kind: ContextKind.Assumption,
      summary,
      content,
      phaseNumber,
      importance: ContextImportance.Medium,
      topics,
      provenance,
    });
  }

  /**
   * Push a requirement entry.
   */
  pushRequirement(
    summary: string,
    content: string,
    phaseNumber: string,
    topics: string[],
    provenance: string[],
  ): ContextEntry {
    return this.pushEntry('recent_history', {
      kind: ContextKind.Requirement,
      summary,
      content,
      phaseNumber,
      importance: ContextImportance.High,
      topics,
      provenance,
    });
  }

  // ─── Query API ─────────────────────────────────────────────────────────────

  /**
   * Query across all layers (or specific ones) with filters.
   * Returns entries sorted by relevance to the query.
   */
  query(q: ContextQuery): ContextQueryResult {
    const layerNames = q.layer
      ? [q.layer]
      : (['working', 'recent_history', 'project_memory', 'session'] as ContextLayerName[]);

    let allMatching: ContextEntry[] = [];

    for (const layerName of layerNames) {
      const layer = this.layers.get(layerName);
      if (!layer) continue;

      const layerResults = this.filterEntries(layer.entries, q);
      allMatching.push(...layerResults);
    }

    // Sort
    allMatching = this.sortEntries(allMatching, q.sortBy ?? 'recency');

    // Apply limit
    const limit = q.limit ?? allMatching.length;
    const truncated = allMatching.length > limit;
    const entries = allMatching.slice(0, limit);

    return {
      entries,
      totalReturned: entries.length,
      totalAvailable: allMatching.length,
      truncated,
      query: q,
    };
  }

  /**
   * Get entries for LLM reference - formatted as a prompt-friendly string.
   * Groups by kind and phase for clear navigation.
   */
  getLLMContext(q: ContextQuery): string {
    const result = this.query(q);

    if (result.entries.length === 0) {
      return '';
    }

    const lines: string[] = ['## Relevant Context\n'];

    // Group by kind for clarity
    const byKind = new Map<ContextKind, ContextEntry[]>();
    for (const entry of result.entries) {
      const existing = byKind.get(entry.kind) ?? [];
      existing.push(entry);
      byKind.set(entry.kind, existing);
    }

    for (const [kind, entries] of byKind) {
      lines.push(`### ${kind.replace(/_/g, ' ').toUpperCase()}\n`);
      for (const entry of entries) {
        const phase = entry.phaseNumber ? `[Phase ${entry.phaseNumber}] ` : '';
        lines.push(`- **${phase}${entry.summary}**`);
        if (entry.content.length < 200) {
          lines.push(`  ${entry.content}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get decisions relevant to a topic or phase.
   * For LLM question: "What did we decide about X?"
   */
  getDecisions(options: { topic?: string; phase?: string; limit?: number } = {}): ContextEntry[] {
    const result = this.query({
      kinds: [ContextKind.Decision, ContextKind.TechChoice],
      topics: options.topic ? [options.topic] : undefined,
      phases: options.phase ? [options.phase] : undefined,
      limit: options.limit ?? 10,
      sortBy: 'recency',
    });
    return result.entries;
  }

  /**
   * Get gaps found in verification.
   * For LLM question: "What gaps were found and not yet addressed?"
   */
  getOpenGaps(): ContextEntry[] {
    const result = this.query({
      kinds: [ContextKind.GapFound],
      limit: 10,
      sortBy: 'recency',
    });
    return result.entries;
  }

  // ─── Summary & Token Budgeting ───────────────────────────────────────────

  /**
   * Get a summary of all layers for token budgeting.
   */
  getSummary(): ContextSummary {
    const layerSummaries: ContextLayerSummary[] = [];

    for (const layerName of ['working', 'recent_history', 'project_memory', 'session'] as ContextLayerName[]) {
      const layer = this.layers.get(layerName);
      if (!layer) continue;
      layerSummaries.push(this.summarizeLayer(layer));
    }

    const allEntries = layerSummaries.flatMap(() => {
      const layer = this.layers.get(layerSummaries[0]?.name);
      return layer?.entries ?? [];
    });

    return {
      layers: layerSummaries,
      totalEntries: layerSummaries.reduce((sum, l) => sum + l.entryCount, 0),
      totalEstimatedTokens: layerSummaries.reduce((sum, l) => sum + l.estimatedTokens, 0),
      phasesCovered: [...new Set(
        layerSummaries.flatMap(l => {
          const layer = this.layers.get(l.name);
          return (layer?.entries ?? []).map(e => e.phaseNumber).filter(Boolean);
        })
      )] as string[],
      recentDecisions: this.query({ kinds: [ContextKind.Decision], limit: 5, sortBy: 'recency' }).entries,
      recentGaps: this.query({ kinds: [ContextKind.GapFound], limit: 3, sortBy: 'recency' }).entries,
      pendingQuestions: this.derivePendingQuestions(),
    };
  }

  /**
   * Get a compressed/summarized view of old entries for token budget.
   * Called when approaching token limits.
   */
  getCompressedContext(maxTokens: number): string {
    const summary = this.getSummary();
    const lines: string[] = ['## Context Summary (compressed)\n'];

    // Always include critical decisions
    const critical = this.query({
      kinds: [ContextKind.Decision, ContextKind.TechChoice],
      minImportance: ContextImportance.Critical,
      limit: 10,
    });
    lines.push('### Key Decisions\n');
    for (const entry of critical.entries) {
      lines.push(`- ${entry.summary}`);
    }

    // Include recent phase summaries
    lines.push('\n### Recent Phase Outcomes\n');
    const phaseOutcomes = this.query({
      kinds: [ContextKind.PlanOutcome, ContextKind.GapFound],
      limit: 20,
      sortBy: 'recency',
    });
    for (const entry of phaseOutcomes.entries) {
      lines.push(`- ${entry.summary}`);
    }

    // Open gaps
    const gaps = this.getOpenGaps();
    if (gaps.length > 0) {
      lines.push('\n### Open Gaps\n');
      for (const gap of gaps) {
        lines.push(`- ${gap.summary}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Estimate total tokens across all layers.
   */
  estimateTotalTokens(): number {
    let total = 0;
    for (const layer of this.layers.values()) {
      for (const entry of layer.entries) {
        total += entry.tokenEstimate ?? this.estimateEntryTokens(entry);
      }
    }
    return total;
  }

  // ─── Persistence ─────────────────────────────────────────────────────────

  /**
   * Ensure the context directory exists.
   */
  private async ensureContextDir(): Promise<void> {
    try {
      await access(this.contextDir, constants.R_OK);
    } catch {
      await mkdir(this.contextDir, { recursive: true });
    }
  }

  /**
   * Persist project_memory layer to disk.
   * Called at end of milestone for durability.
   */
  async persistProjectMemory(): Promise<void> {
    const layer = this.layers.get('project_memory');
    if (!layer) return;

    await this.ensureContextDir();

    const persistence: ProjectMemoryPersistence = {
      version: 1,
      entries: layer.entries,
      lastUpdated: new Date().toISOString(),
    };

    const path = join(this.contextDir, 'project_memory.json');
    await writeFile(path, JSON.stringify(persistence, null, 2), 'utf-8');
  }

  /**
   * Load project_memory layer from disk.
   * Called at start of new session/milestone.
   */
  async loadProjectMemory(): Promise<void> {
    const path = join(this.contextDir, 'project_memory.json');
    try {
      const raw = await readFile(path, 'utf-8');
      const persistence: ProjectMemoryPersistence = JSON.parse(raw);
      const layer = this.layers.get('project_memory');
      if (layer && persistence.entries) {
        layer.entries = persistence.entries;
      }
    } catch {
      // File doesn't exist yet - that's fine
    }
  }

  /**
   * Persist recent_history layer to disk.
   */
  async persistRecentHistory(milestoneId: string): Promise<void> {
    const layer = this.layers.get('recent_history');
    if (!layer) return;

    await this.ensureContextDir();

    const persistence: RecentHistoryPersistence = {
      version: 1,
      entries: layer.entries,
      milestoneId,
      lastUpdated: new Date().toISOString(),
    };

    const path = join(this.contextDir, 'recent_history.json');
    await writeFile(path, JSON.stringify(persistence, null, 2), 'utf-8');
  }

  /**
   * Load recent_history layer from disk.
   */
  async loadRecentHistory(): Promise<void> {
    const path = join(this.contextDir, 'recent_history.json');
    try {
      const raw = await readFile(path, 'utf-8');
      const persistence: RecentHistoryPersistence = JSON.parse(raw);
      const layer = this.layers.get('recent_history');
      if (layer && persistence.entries) {
        layer.entries = persistence.entries;
      }
    } catch {
      // File doesn't exist yet - that's fine
    }
  }

  /**
   * Serialize recent_history to markdown for .gsdt-planning/ persistence.
   * Produces a human-readable audit trail.
   */
  toMarkdown(): string {
    const lines: string[] = ['# Layered Context History\n', '## Recent History\n'];

    const recentEntries = this.query({
      layer: 'recent_history',
      sortBy: 'recency',
      limit: 50,
    }).entries;

    for (const entry of recentEntries) {
      const ts = new Date(entry.createdAt).toISOString();
      lines.push(`### [${entry.phaseNumber ?? 'N/A'}] ${entry.kind}: ${entry.summary}`);
      lines.push(`_${ts}_`);
      lines.push(entry.content);
      lines.push('');
    }

    return lines.join('\n');
  }

  // ─── Layer Management ───────────────────────────────────────────────────

  /**
   * Clear a specific layer.
   */
  clearLayer(layerName: ContextLayerName): void {
    const layer = this.requireLayer(layerName);
    layer.entries = [];
    layer.lastAccessedAt = new Date().toISOString();
  }

  /**
   * Clear working context (called between phase steps).
   */
  clearWorking(): void {
    this.clearLayer('working');
  }

  /**
   * Archive recent_history entries to project_memory.
   * Called at end of milestone.
   */
  archiveToProjectMemory(): void {
    const recent = this.layers.get('recent_history');
    const project = this.layers.get('project_memory');
    if (!recent || !project) return;

    // Move important entries (decisions, tech choices) to project_memory
    for (const entry of recent.entries) {
      if (entry.importance >= ContextImportance.High) {
        project.entries.push({
          ...entry,
          derivedFrom: entry.id,
          layer: 'project_memory',
        });
      }
    }

    // Prune project_memory after archive
    this.pruneLayer('project_memory');

    // Clear recent_history after archive
    recent.entries = [];
  }

  /**
   * Get a layer by name.
   */
  getLayer(name: ContextLayerName): ContextLayer | undefined {
    return this.layers.get(name);
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private requireLayer(name: ContextLayerName): ContextLayer {
    const layer = this.layers.get(name);
    if (!layer) {
      throw new Error(`LayeredContextManager: unknown layer ${name}`);
    }
    return layer;
  }

  private filterEntries(entries: ContextEntry[], q: ContextQuery): ContextEntry[] {
    return entries.filter(entry => {
      if (q.kinds && !q.kinds.includes(entry.kind)) return false;
      if (q.phases && !q.phases.includes(entry.phaseNumber ?? '')) return false;
      if (q.steps && !q.steps.includes(entry.step ?? '')) return false;
      if (q.minImportance && entry.importance < q.minImportance) return false;
      if (q.topics && !q.topics.some(t => entry.topics.includes(t))) return false;
      if (q.derivedFrom && entry.derivedFrom !== q.derivedFrom) return false;
      if (q.search) {
        const searchLower = q.search.toLowerCase();
        const matches =
          entry.summary.toLowerCase().includes(searchLower) ||
          entry.content.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }

  private sortEntries(entries: ContextEntry[], sortBy: 'recency' | 'importance' | 'kind'): ContextEntry[] {
    switch (sortBy) {
      case 'recency':
        return [...entries].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'importance':
        return [...entries].sort((a, b) => b.importance - a.importance);
      case 'kind':
        return [...entries].sort((a, b) => a.kind.localeCompare(b.kind));
      default:
        return entries;
    }
  }

  private pruneLayer(layerName: ContextLayerName): void {
    const layer = this.requireLayer(layerName);

    // Prune by age
    if (layer.maxAgeMs !== null) {
      const cutoff = Date.now() - layer.maxAgeMs;
      layer.entries = layer.entries.filter(
        e => new Date(e.createdAt).getTime() > cutoff
      );
    }

    // Prune by count (keep newest)
    if (layer.entries.length > layer.maxEntries) {
      const sorted = this.sortEntries(layer.entries, 'recency');
      layer.entries = sorted.slice(0, layer.maxEntries);
    }
  }

  private summarizeLayer(layer: ContextLayer): ContextLayerSummary {
    const byKind = new Map<string, number>();
    const allTopics: string[] = [];
    let totalTokens = 0;

    for (const entry of layer.entries) {
      const kindCount = byKind.get(entry.kind) ?? 0;
      byKind.set(entry.kind, kindCount + 1);
      allTopics.push(...entry.topics);
      totalTokens += entry.tokenEstimate ?? this.estimateEntryTokens(entry);
    }

    // Count topic frequency
    const topicCounts = new Map<string, number>();
    for (const topic of allTopics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }
    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    const timestamps = layer.entries.map(e => e.createdAt).sort();

    return {
      name: layer.name,
      entryCount: layer.entries.length,
      estimatedTokens: totalTokens,
      oldestEntry: timestamps[0] ?? null,
      newestEntry: timestamps[timestamps.length - 1] ?? null,
      kindCounts: Object.fromEntries(byKind),
      topTopics,
    };
  }

  private estimateEntryTokens(entry: ContextEntry): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil((entry.summary.length + entry.content.length) / 4);
  }

  private extractTopics(content: string): string[] {
    // Extract potential topics from content (simple heuristic)
    const topicPattern = /(?:tech|stack|framework|library|architecture|database|auth|api)/gi;
    const matches = content.match(topicPattern);
    return matches ? [...new Set(matches.map(t => t.toLowerCase()))] : [];
  }

  private derivePendingQuestions(): string[] {
    const questions: string[] = [];

    // Find gaps that weren't addressed
    const gaps = this.getOpenGaps();
    for (const gap of gaps) {
      questions.push(`Open gap: ${gap.summary}`);
    }

    // Find phases with failed plans
    const failedPlans = this.query({
      kinds: [ContextKind.PlanOutcome],
      limit: 10,
      sortBy: 'recency',
    }).entries.filter(e => e.content.includes('"success":false'));

    for (const plan of failedPlans) {
      questions.push(`Failed plan: ${plan.summary}`);
    }

    return questions.slice(0, 10);
  }
}
