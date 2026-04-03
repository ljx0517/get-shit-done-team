/**
 * GSDT Unified Review System - Type Definitions
 */

// Enums
export enum Severity {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

export enum AutofixClass {
  SAFE_AUTO = 'safe_auto',
  GATED_AUTO = 'gated_auto',
  MANUAL = 'manual',
  ADVISORY = 'advisory',
}

export enum ReviewMode {
  CROSS_AI = 'cross-ai',
  UI_AUDIT = 'ui-audit',
  SHIP = 'ship',
}

export enum ReviewerSource {
  GEMINI = 'gemini',
  CLAUDE = 'claude',
  CODEX = 'codex',
  UI_AUDITOR = 'ui-auditor',
  HUMAN = 'human',
}

export enum UIPillar {
  COPYWRITING = 'copywriting',
  VISUALS = 'visuals',
  COLOR = 'color',
  TYPOGRAPHY = 'typography',
  SPACING = 'spacing',
  EXPERIENCE = 'experience',
}

export enum ReviewSessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  FAILED = 'failed',
}

export enum ReviewPhase {
  GATHER = 'gather',
  DEDUPE = 'dedupe',
  FILTER = 'filter',
  CLASSIFY = 'classify',
  OUTPUT = 'output',
}

// Core Finding interface
export interface Finding {
  id: string;
  source: ReviewerSource;
  severity: Severity;
  autofix_class: AutofixClass;
  confidence: number; // 0.0-1.0
  title: string;
  description: string;
  file?: string;
  line?: number;
  fingerprint?: string; // SHA256[:12] for dedup
  pillar?: UIPillar;
  ui_score?: number; // 1-4 for UI pillar
  confirmed_by: ReviewerSource[];
  created_at: string;
  requirement_id?: string;
  duplicate_of?: string;
  evidence?: string[];
  suggestions?: string[];
}

// Raw finding from AI reviewer before processing
export interface RawFinding {
  title: string;
  description: string;
  severity_hint?: string;
  confidence_hint?: number;
  file?: string;
  line?: number;
  source: ReviewerSource;
  pillar?: UIPillar;
  ui_score?: number;
}

// Reviewer output container
export interface ReviewerOutput {
  source: ReviewerSource;
  raw_content: string;
  findings: RawFinding[];
  error?: string;
}

// ReviewSession - full session state
export interface ReviewSession {
  id: string; // rev_{timestamp}_{random}
  type: ReviewMode;
  phase?: string;
  pr_number?: number;
  status: ReviewSessionStatus;
  current_phase?: ReviewPhase;
  reviewers: ReviewerSource[];
  findings: Finding[];
  config: ReviewConfig;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  checkpoint?: {
    reviewers_completed: ReviewerSource[];
    findings_partial: Finding[];
  };
  errors: string[];
}

// ReviewConfig - session configuration
export interface ReviewConfig {
  confidence_threshold: number; // 默认 0.60
  p0_confidence_threshold: number; // P0: 0.50
  enable_dedup: boolean;
  enable_boost: boolean;
  enable_requirements_trace: boolean;
  modes: {
    interactive: boolean;
    autofix: boolean;
    report: boolean;
    headless: boolean;
  };
  personas: {
    always_on: ReviewerSource[];
    conditional: Array<{
      if: string;
      use: ReviewerSource[];
    }>;
  };
}

// ReviewSummary - aggregated summary
export interface ReviewSummary {
  total_raw: number;
  total_after_dedup: number;
  total_after_filter: number;
  suppressed_count: number;
  boosted_count: number;
  by_severity: Record<Severity, number>;
  by_autofix_class: Record<AutofixClass, number>;
  by_source: Record<ReviewerSource, number>;
}

// ReviewStatistics - detailed statistics
export interface ReviewStatistics {
  duration_ms: number;
  reviewers_completed: ReviewerSource[];
  reviewers_failed: ReviewerSource[];
}

// ReviewOutput - final formatted output
export interface ReviewOutput {
  version: string;
  session_id: string;
  type: ReviewMode;
  phase?: string;
  pr_number?: number;
  reviewed_at: string;
  mode: string;
  reviewers: {
    requested: ReviewerSource[];
    completed: ReviewerSource[];
    failed: ReviewerSource[];
  };
  config: ReviewConfig;
  summary: ReviewSummary;
  findings: Finding[];
  requirements_trace?: Record<string, { covered: boolean; findings: string[] }>;
  routing?: {
    immediate_fix: string[];
    next_sprint: string[];
    backlog: string[];
  };
  next_steps?: {
    auto_fixable: number;
    requires_human: number;
    suggested_commit?: string;
  };
  statistics: ReviewStatistics;
  errors: string[];
}

// UI Pillar scores
export interface UIPillarScores {
  [UIPillar.COPYWRITING]: number;
  [UIPillar.VISUALS]: number;
  [UIPillar.COLOR]: number;
  [UIPillar.TYPOGRAPHY]: number;
  [UIPillar.SPACING]: number;
  [UIPillar.EXPERIENCE]: number;
}

// UIAuditResult - UI audit specific result
export interface UIAuditResult extends ReviewOutput {
  pillar_scores: UIPillarScores;
}

// Routing matrix entry
export interface RoutingEntry {
  severity: Severity;
  autofix_class: AutofixClass;
  action: 'immediate_fix' | 'next_sprint' | 'backlog' | 'ignore';
}

// Default configuration
export const DEFAULT_REVIEW_CONFIG: ReviewConfig = {
  confidence_threshold: 0.6,
  p0_confidence_threshold: 0.5,
  enable_dedup: true,
  enable_boost: true,
  enable_requirements_trace: true,
  modes: {
    interactive: true,
    autofix: true,
    report: true,
    headless: true,
  },
  personas: {
    always_on: [ReviewerSource.GEMINI, ReviewerSource.CLAUDE],
    conditional: [],
  },
};

// Severity keyword mapping
export const SEVERITY_KEYWORDS: Record<Severity, string[]> = {
  [Severity.P0]: ['critical', 'crash', 'security', 'data loss', 'broken', 'must fix', 'urgent', 'fatal'],
  [Severity.P1]: ['high', 'important', 'significant', 'should fix', 'regression', 'major'],
  [Severity.P2]: ['medium', 'minor', 'next sprint', 'moderate'],
  [Severity.P3]: ['low', 'nice to have', 'optional', 'advisory', 'suggestion'],
};

// AutofixClass keyword mapping
export const AUTOFIX_KEYWORDS: Record<AutofixClass, string[]> = {
  [AutofixClass.SAFE_AUTO]: ['auto-fix', 'autofix', 'safe to auto', 'linter', 'formatter', 'simple fix'],
  [AutofixClass.GATED_AUTO]: ['auto', 'needs review', 'gated', 'may break', 'conditional'],
  [AutofixClass.MANUAL]: ['manual', 'human', 'refactor', 'architectural', 'complex'],
  [AutofixClass.ADVISORY]: ['suggestion', 'consider', 'nice to have', 'advisory'],
};
