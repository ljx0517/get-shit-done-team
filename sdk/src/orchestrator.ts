/**
 * Orchestrator — simplified entry point for running GSD workflows.
 *
 * Coordinates the simplified flow:
 * 1. CLASSIFY — Analyze user input, produce CLASSIFICATION.md
 * 2. DESIGN_MILESTONE — Create roadmap based on classification (for new projects)
 * 3. PHASE_EXECUTION — Delegate to GSD.run() for actual phase execution
 * 4. COMPLETION — Produce final summary
 *
 * @example
 * ```typescript
 * import { Orchestrator } from '@gsdt/sdk';
 *
 * const orchestrator = new Orchestrator({ projectDir: '/path/to/project' });
 * const result = await orchestrator.start("build a chat app with real-time messaging");
 *
 * console.log(`Success: ${result.success}`);
 * console.log(`Total cost: $${result.totalCostUsd.toFixed(4)}`);
 * ```
 */

import { readFile, access, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { constants } from 'node:fs';

import type { GSDOptions, PlanResult, SessionOptions, GSDEvent, TransportHandler, PhaseRunnerOptions, PhaseRunnerResult, MilestoneRunnerOptions, MilestoneRunnerResult, RoadmapPhaseInfo } from './types.js';
import { GSDEventType, PhaseType, PhaseStepType } from './types.js';
import { loadConfig } from './config.js';
import { GSDTools } from './gsdt-tools.js';
import { runPhaseStepSession } from './session-runner.js';
import { GSDEventStream } from './event-stream.js';
import { GSD } from './index.js';
import { PromptFactory } from './phase-prompt.js';
import { ContextEngine } from './context-engine.js';
import { LayeredContextManager } from './layered-context/index.js';
import { DEFAULT_PLANNING_DIR, resolveGsdToolsPath } from './path-config.js';

// ─── Orchestrator interfaces ───────────────────────────────────────────────────

export interface OrchestratorOptions extends GSDOptions {
  /** Called after each phase completes. Return 'stop' to halt execution. */
  onPhaseComplete?: (result: PhaseRunnerResult, phase: RoadmapPhaseInfo) => Promise<void | 'stop'>;
  /** Called when classification completes. */
  onClassificationComplete?: (result: ClassificationResult) => Promise<void>;
  /** Called when milestone design completes. */
  onMilestoneDesignComplete?: (result: MilestoneDesignResult) => Promise<void>;
  /** Planning directory name. Default: '.gsdt-planning' */
  planningDir?: string;
}

export interface ClassificationResult {
  success: boolean;
  projectType: 'new_project' | 'feature' | 'refactor' | 'bugfix';
  domain: string;
  complexity: 'simple' | 'standard' | 'complex';
  keywords: string[];
  explicitRequirements: string[];
  implicitRequirements: string[];
  specialConsiderations: {
    uiNeeded: boolean;
    database: boolean;
    authentication: boolean;
    externalApis: boolean;
    realtime: boolean;
  };
}

export interface MilestoneDesignResult {
  success: boolean;
  milestoneName: string;
  phaseCount: number;
}

export interface OrchestratorResult {
  success: boolean;
  classificationResult?: ClassificationResult;
  milestoneDesignResult?: MilestoneDesignResult;
  phaseResults: PhaseRunnerResult[];
  totalCostUsd: number;
  totalDurationMs: number;
}

// ─── Orchestrator class ───────────────────────────────────────────────────────

export class Orchestrator {
  private readonly projectDir: string;
  private readonly gsdToolsPath: string;
  private readonly defaultModel?: string;
  private readonly defaultMaxBudgetUsd: number;
  private readonly defaultMaxTurns: number;
  private readonly autoMode: boolean;
  private readonly planningDir: string;
  readonly eventStream: GSDEventStream;
  private readonly gsd: GSD;

  constructor(options: OrchestratorOptions) {
    this.projectDir = resolve(options.projectDir);
    this.gsdToolsPath = options.gsdToolsPath ?? resolveGsdToolsPath(this.projectDir);
    this.defaultModel = options.model;
    this.defaultMaxBudgetUsd = options.maxBudgetUsd ?? 5.0;
    this.defaultMaxTurns = options.maxTurns ?? 50;
    this.autoMode = options.autoMode ?? true;
    this.planningDir = options.planningDir ?? DEFAULT_PLANNING_DIR;
    this.eventStream = new GSDEventStream();
    this.gsd = new GSD({
      projectDir: this.projectDir,
      gsdToolsPath: this.gsdToolsPath,
      model: this.defaultModel,
      maxBudgetUsd: this.defaultMaxBudgetUsd,
      maxTurns: this.defaultMaxTurns,
      autoMode: this.autoMode,
    });
  }

  /**
   * Start the simplified orchestration flow.
   *
   * 1. Run Classify phase to analyze input
   * 2. Run DesignMilestone phase to create roadmap (for new projects)
   * 3. Delegate to GSD.run() for phase execution
   *
   * @param input - Raw user input/idea
   * @param options - Orchestrator options including callbacks
   * @returns OrchestratorResult with classification, design, and execution results
   */
  async start(input: string, options?: OrchestratorOptions): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const sessionId = `orchestrator-${Date.now()}`;

    // Emit OrchestrationStart
    this.eventStream.emitEvent({
      type: GSDEventType.OrchestrationStart,
      timestamp: new Date().toISOString(),
      sessionId,
    });

    // Emit ClassificationStart
    this.eventStream.emitEvent({
      type: GSDEventType.ClassificationStart,
      timestamp: new Date().toISOString(),
      sessionId,
    });

    // ── Stage 1: Classify ───────────────────────────────────────────────────
    const classifyResult = await this.runClassifyPhase(input);
    if (!classifyResult.success) {
      return this.buildResult(false, startTime, classifyResult, undefined, [], options);
    }

    // Parse classification output
    const classification = await this.parseClassificationResult();
    if (!classification) {
      return this.buildResult(false, startTime, classifyResult, undefined, [], options);
    }

    // Notify callback
    if (options?.onClassificationComplete) {
      await options.onClassificationComplete(classification);
    }

    // Emit ClassificationComplete with actual results
    this.eventStream.emitEvent({
      type: GSDEventType.ClassificationComplete,
      timestamp: new Date().toISOString(),
      sessionId,
      projectType: classification.projectType,
      domain: classification.domain,
      complexity: classification.complexity,
    });

    // ── Stage 2: Design Milestone (for new projects) ─────────────────────────
    let milestoneResult: MilestoneDesignResult | undefined;
    if (classification.projectType === 'new_project') {
      milestoneResult = await this.runDesignMilestonePhase();
      if (!milestoneResult.success) {
        return this.buildResult(false, startTime, classifyResult, milestoneResult, [], options);
      }

      if (options?.onMilestoneDesignComplete) {
        await options.onMilestoneDesignComplete(milestoneResult);
      }
    }

    // ── Stage 3: Phase Execution ────────────────────────────────────────────
    // Create and initialize layered context manager
    const contextManager = new LayeredContextManager(this.projectDir);
    await contextManager.loadProjectMemory();

    // Delegate to GSD for actual phase execution
    const milestoneOptions: MilestoneRunnerOptions = {
      onPhaseComplete: options?.onPhaseComplete,
      contextManager,
    };

    const milestoneResult2 = await this.gsd.run(input, milestoneOptions);

    // Archive recent history to project memory and persist at milestone end
    contextManager.archiveToProjectMemory();
    await contextManager.persistProjectMemory();

    // Build final result
    const totalCostUsd = classifyResult.totalCostUsd +
      (milestoneResult?.success ? 0 : 0) + // milestone phases are cheap
      milestoneResult2.totalCostUsd;

    const totalDurationMs = Date.now() - startTime;

    // Emit OrchestrationComplete
    this.eventStream.emitEvent({
      type: GSDEventType.OrchestrationComplete,
      timestamp: new Date().toISOString(),
      sessionId,
      success: milestoneResult2.success,
      totalCostUsd,
      totalDurationMs,
      phasesCompleted: milestoneResult2.phases.length,
    });

    return {
      success: milestoneResult2.success,
      classificationResult: classification,
      milestoneDesignResult: milestoneResult,
      phaseResults: milestoneResult2.phases,
      totalCostUsd,
      totalDurationMs,
    };
  }

  /**
   * Run the Classify phase.
   * Produces CLASSIFICATION.md in the planning directory.
   */
  private async runClassifyPhase(input: string): Promise<PlanResult> {
    // Build the classification prompt
    const promptFactory = new PromptFactory({ projectDir: this.projectDir });
    const config = await loadConfig(this.projectDir);

    const contextFiles = await this.loadContextForClassify();
    const prompt = await promptFactory.buildPrompt(PhaseType.Classify, null, contextFiles);

    // Create planning directory if it doesn't exist
    await this.ensurePlanningDir();

    // Prepend user input to the prompt
    const fullPrompt = `Analyze this user input and produce a classification:\n\n"${input}"\n\n${prompt}`;

    const sessionOptions: SessionOptions = {
      maxTurns: this.defaultMaxTurns,
      maxBudgetUsd: this.defaultMaxBudgetUsd,
      model: this.defaultModel,
      cwd: this.projectDir,
      allowedTools: ['Read', 'Bash', 'Grep', 'Glob', 'Write'],
    };

    return runPhaseStepSession(
      fullPrompt,
      PhaseStepType.Discuss, // Reuse Discuss step type for tool scoping
      config,
      sessionOptions,
      this.eventStream,
      { phase: PhaseType.Classify }
    );
  }

  /**
   * Run the DesignMilestone phase.
   * Produces ROADMAP.md in the planning directory.
   */
  private async runDesignMilestonePhase(): Promise<MilestoneDesignResult> {
    const promptFactory = new PromptFactory({ projectDir: this.projectDir });
    const config = await loadConfig(this.projectDir);

    const contextFiles = await this.loadContextForDesignMilestone();
    const prompt = await promptFactory.buildPrompt(PhaseType.DesignMilestone, null, contextFiles);

    const sessionOptions: SessionOptions = {
      maxTurns: this.defaultMaxTurns,
      maxBudgetUsd: this.defaultMaxBudgetUsd,
      model: this.defaultModel,
      cwd: this.projectDir,
      allowedTools: ['Read', 'Bash', 'Grep', 'Glob', 'Write'],
    };

    const result = await runPhaseStepSession(
      prompt,
      PhaseStepType.Discuss,
      config,
      sessionOptions,
      this.eventStream,
      { phase: PhaseType.DesignMilestone }
    );

    // Extract milestone info from ROADMAP.md
    const roadmapContent = await this.readFileIfExists(join(this.projectDir, this.planningDir, 'ROADMAP.md'));
    const milestoneName = this.extractMilestoneName(roadmapContent);

    return {
      success: result.success,
      milestoneName: milestoneName ?? 'Unnamed Milestone',
      phaseCount: this.countPhasesInRoadmap(roadmapContent),
    };
  }

  /**
   * Load context files needed for classification.
   */
  private async loadContextForClassify(): Promise<Record<string, string>> {
    const context: Record<string, string> = {};

    // Check for existing project
    const projectPath = join(this.projectDir, this.planningDir, 'PROJECT.md');
    const projectContent = await this.readFileIfExists(projectPath);
    if (projectContent) {
      context['existing_project'] = projectContent;
    }

    const roadmapPath = join(this.projectDir, this.planningDir, 'ROADMAP.md');
    const roadmapContent = await this.readFileIfExists(roadmapPath);
    if (roadmapContent) {
      context['existing_roadmap'] = roadmapContent;
    }

    return context;
  }

  /**
   * Load context files needed for milestone design.
   */
  private async loadContextForDesignMilestone(): Promise<Record<string, string>> {
    const context: Record<string, string> = {};

    const classifyPath = join(this.projectDir, this.planningDir, 'CLASSIFICATION.md');
    const classifyContent = await this.readFileIfExists(classifyPath);
    if (classifyContent) {
      context['classification'] = classifyContent;
    }

    const projectPath = join(this.projectDir, this.planningDir, 'PROJECT.md');
    const projectContent = await this.readFileIfExists(projectPath);
    if (projectContent) {
      context['project'] = projectContent;
    }

    return context;
  }

  /**
   * Parse the CLASSIFICATION.md file into a structured result.
   */
  private async parseClassificationResult(): Promise<ClassificationResult | undefined> {
    const classifyPath = join(this.projectDir, this.planningDir, 'CLASSIFICATION.md');
    const content = await this.readFileIfExists(classifyPath);
    if (!content) return undefined;

    try {
      return {
        success: true,
        projectType: this.extractField(content, 'Project Type') as ClassificationResult['projectType'] ?? 'new_project',
        domain: this.extractField(content, 'Domain') ?? 'unknown',
        complexity: this.extractField(content, 'Complexity') as ClassificationResult['complexity'] ?? 'standard',
        keywords: this.extractList(content, 'Keywords Detected'),
        explicitRequirements: this.extractList(content, 'Explicit Requirements'),
        implicitRequirements: this.extractList(content, 'Implicit Requirements'),
        specialConsiderations: {
          uiNeeded: this.extractBoolean(content, 'UI Needed'),
          database: this.extractBoolean(content, 'Database'),
          authentication: this.extractBoolean(content, 'Authentication'),
          externalApis: this.extractBoolean(content, 'External APIs'),
          realtime: this.extractBoolean(content, 'Real-time'),
        },
      };
    } catch {
      return undefined;
    }
  }

  private extractField(content: string, field: string): string | null {
    const regex = new RegExp(`^${field}:\\s*(.+)$`, 'im');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractList(content: string, field: string): string[] {
    const fieldRegex = new RegExp(`^${field}[\\s\\S]*?(?=^[A-Z]|\\Z)`, 'im');
    const match = content.match(fieldRegex);
    if (!match) return [];

    const listRegex = /^\s*-\s+(.+)$/gm;
    const items: string[] = [];
    let listMatch;
    while ((listMatch = listRegex.exec(match[0])) !== null) {
      items.push(listMatch[1].trim());
    }
    return items;
  }

  private extractBoolean(content: string, field: string): boolean {
    const value = this.extractField(content, field);
    return value?.toLowerCase() === 'yes';
  }

  private extractMilestoneName(content: string | undefined): string | null {
    if (!content) return null;
    const match = content.match(/^#\s*Roadmap:\s*(.+)$/im);
    return match ? match[1].trim() : null;
  }

  private countPhasesInRoadmap(content: string | undefined): number {
    if (!content) return 0;
    const phaseRegex = /^### Phase \d+:/gm;
    const matches = content.match(phaseRegex);
    return matches ? matches.length : 0;
  }

  private async ensurePlanningDir(): Promise<void> {
    const planningPath = join(this.projectDir, this.planningDir);
    try {
      await access(planningPath, constants.R_OK);
    } catch {
      await mkdir(planningPath, { recursive: true });
    }
  }

  private async readFileIfExists(filePath: string): Promise<string | undefined> {
    try {
      await access(filePath, constants.R_OK);
      return await readFile(filePath, 'utf-8');
    } catch {
      return undefined;
    }
  }

  private buildResult(
    success: boolean,
    startTime: number,
    classifyResult: PlanResult,
    milestoneResult: MilestoneDesignResult | undefined,
    phaseResults: PhaseRunnerResult[],
    _options?: OrchestratorOptions
  ): OrchestratorResult {
    return {
      success,
      classificationResult: {
        success: classifyResult.success,
        projectType: 'new_project',
        domain: 'unknown',
        complexity: 'standard',
        keywords: [],
        explicitRequirements: [],
        implicitRequirements: [],
        specialConsiderations: {
          uiNeeded: false,
          database: false,
          authentication: false,
          externalApis: false,
          realtime: false,
        },
      },
      milestoneDesignResult: milestoneResult,
      phaseResults,
      totalCostUsd: classifyResult.totalCostUsd + (milestoneResult?.success ? 0 : 0),
      totalDurationMs: Date.now() - startTime,
    };
  }

  /**
   * Subscribe a handler to receive all GSD events.
   */
  onEvent(handler: (event: GSDEvent) => void): void {
    this.eventStream.on('event', handler);
  }

  /**
   * Subscribe a transport handler.
   */
  addTransport(handler: TransportHandler): void {
    this.eventStream.addTransport(handler);
  }
}
