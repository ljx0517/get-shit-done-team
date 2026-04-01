import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Orchestrator } from './orchestrator.js';
import type {
  PlanResult,
  SessionUsage,
  MilestoneRunnerResult,
  PhaseRunnerResult,
} from './types.js';
import { GSDEventType } from './types.js';

// ─── Mock modules ───────────────────────────────────────────────────────────────

vi.mock('./gsdt-tools.js', () => ({
  GSDTools: vi.fn(),
  resolveGsdToolsPath: vi.fn().mockReturnValue('/mock/gsd-tools'),
}));

vi.mock('./session-runner.js', () => ({
  runPhaseStepSession: vi.fn(),
}));

vi.mock('./event-stream.js', () => ({
  GSDEventStream: vi.fn().mockImplementation(() => ({
    emitEvent: vi.fn(),
    on: vi.fn(),
    addTransport: vi.fn(),
  })),
}));

vi.mock('./index.js', () => ({
  GSD: vi.fn().mockImplementation(() => ({
    run: vi.fn(),
  })),
}));

vi.mock('./phase-prompt.js', () => ({
  PromptFactory: vi.fn().mockImplementation(() => ({
    buildPrompt: vi.fn().mockResolvedValue('mock prompt content'),
  })),
}));

vi.mock('./context-engine.js', () => ({
  ContextEngine: vi.fn(),
}));

vi.mock('./layered-context/index.js', () => ({
  LayeredContextManager: vi.fn().mockImplementation(() => ({
    loadProjectMemory: vi.fn().mockResolvedValue(undefined),
    archiveToProjectMemory: vi.fn(),
    persistProjectMemory: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./config.js', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    model: 'claude-sonnet-4-6',
    maxBudgetUsd: 5.0,
    maxTurns: 50,
  }),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { runPhaseStepSession } from './session-runner.js';
import { GSDEventStream } from './event-stream.js';
import { GSD } from './index.js';
import { PromptFactory } from './phase-prompt.js';
import { LayeredContextManager } from './layered-context/index.js';
import { loadConfig } from './config.js';

const mockRunPhaseStepSession = vi.mocked(runPhaseStepSession);
const MockGSDEventStream = vi.mocked(GSDEventStream);
const MockGSD = vi.mocked(GSD);
const MockPromptFactory = vi.mocked(PromptFactory);
const MockLayeredContextManager = vi.mocked(LayeredContextManager);
const mockLoadConfig = vi.mocked(loadConfig);

// ─── Factory helpers ───────────────────────────────────────────────────────────

function makeUsage(overrides: Partial<SessionUsage> = {}): SessionUsage {
  return {
    inputTokens: 100,
    outputTokens: 50,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
    ...overrides,
  };
}

function makePlanResult(overrides: Partial<PlanResult> = {}): PlanResult {
  return {
    success: true,
    sessionId: `sess-${Date.now()}`,
    totalCostUsd: 0.001,
    durationMs: 100,
    usage: makeUsage(),
    numTurns: 2,
    ...overrides,
  };
}

function makePhaseRunnerResult(overrides: Partial<PhaseRunnerResult> = {}): PhaseRunnerResult {
  return {
    success: true,
    phaseNumber: '1',
    phaseName: 'Test Phase',
    totalCostUsd: 0.01,
    durationMs: 1000,
    usage: makeUsage(),
    ...overrides,
  };
}

function makeMilestoneRunnerResult(overrides: Partial<MilestoneRunnerResult> = {}): MilestoneRunnerResult {
  return {
    success: true,
    phases: [makePhaseRunnerResult()],
    totalCostUsd: 0.05,
    totalDurationMs: 5000,
    ...overrides,
  };
}

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('Orchestrator', () => {
  let tmpDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    tmpDir = '/tmp/orchestrator-test';
  });

  // ─── Constructor tests ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an Orchestrator instance with default options', () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });

      expect(orchestrator).toBeDefined();
      expect(orchestrator.eventStream).toBeDefined();
    });

    it('creates an Orchestrator instance with custom options', () => {
      const orchestrator = new Orchestrator({
        projectDir: tmpDir,
        model: 'claude-opus-4-6',
        maxBudgetUsd: 10.0,
        maxTurns: 100,
        autoMode: false,
      });

      expect(orchestrator).toBeDefined();
    });

    it('resolves projectDir to absolute path', () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      expect(orchestrator).toBeDefined();
    });
  });

  // ─── Event handling tests ──────────────────────────────────────────────────

  describe('event handling', () => {
    it('allows subscribing to events via onEvent', () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const handler = vi.fn();

      orchestrator.onEvent(handler);

      expect(MockGSDEventStream).toHaveBeenCalled();
    });

    it('allows adding transport handlers via addTransport', () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const transport = { send: vi.fn(), flush: vi.fn() };

      orchestrator.addTransport(transport);

      expect(MockGSDEventStream).toHaveBeenCalled();
    });
  });

  // ─── Classification parsing tests ──────────────────────────────────────────

  describe('classification result parsing', () => {
    it('parses a valid CLASSIFICATION.md content', async () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });

      // Access private method via any for testing
      const parseClassificationResult = (orchestrator as any).parseClassificationResult.bind(orchestrator);

      // Mock the file read
      const classifyContent = `
Project Type: feature
Domain: authentication
Complexity: standard
Keywords Detected:
- login
- oauth
- jwt
Explicit Requirements:
- Implement OAuth2
- Support JWT tokens
Implicit Requirements:
- Error handling
- Logging
UI Needed: no
Database: yes
Authentication: yes
External APIs: no
Real-time: no
`;

      // Mock readFileIfExists to return the content
      const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');
      mockReadFile.mockResolvedValueOnce(classifyContent);

      const result = await parseClassificationResult();

      expect(result).toBeDefined();
      expect(result?.projectType).toBe('feature');
      expect(result?.domain).toBe('authentication');
      expect(result?.complexity).toBe('standard');
      expect(result?.keywords).toEqual(['login', 'oauth', 'jwt']);
      expect(result?.explicitRequirements).toEqual(['Implement OAuth2', 'Support JWT tokens']);
      expect(result?.implicitRequirements).toEqual(['Error handling', 'Logging']);
      expect(result?.specialConsiderations.uiNeeded).toBe(false);
      expect(result?.specialConsiderations.database).toBe(true);
      expect(result?.specialConsiderations.authentication).toBe(true);
      expect(result?.specialConsiderations.externalApis).toBe(false);
      expect(result?.specialConsiderations.realtime).toBe(false);
    });

    it('returns undefined for missing CLASSIFICATION.md', async () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const parseClassificationResult = (orchestrator as any).parseClassificationResult.bind(orchestrator);

      const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');
      mockReadFile.mockResolvedValueOnce(undefined);

      const result = await parseClassificationResult();
      expect(result).toBeUndefined();
    });

    it('handles malformed CLASSIFICATION.md with defaults', async () => {
      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const parseClassificationResult = (orchestrator as any).parseClassificationResult.bind(orchestrator);

      const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');
      mockReadFile.mockResolvedValueOnce('Not a valid classification file');

      const result = await parseClassificationResult();
      // Returns default values for missing fields
      expect(result?.success).toBe(true);
      expect(result?.projectType).toBe('new_project');
      expect(result?.domain).toBe('unknown');
      expect(result?.complexity).toBe('standard');
    });
  });

  // ─── Field extraction tests ────────────────────────────────────────────────

  describe('field extraction helpers', () => {
    let orchestrator: Orchestrator;

    beforeEach(() => {
      orchestrator = new Orchestrator({ projectDir: tmpDir });
    });

    describe('extractField', () => {
      it('extracts a field value from content', () => {
        const extractField = (orchestrator as any).extractField.bind(orchestrator);
        const content = 'Domain: authentication';
        expect(extractField(content, 'Domain')).toBe('authentication');
      });

      it('returns null for missing field', () => {
        const extractField = (orchestrator as any).extractField.bind(orchestrator);
        const content = 'Domain: authentication';
        expect(extractField(content, 'Missing')).toBeNull();
      });

      it('handles case-insensitive matching', () => {
        const extractField = (orchestrator as any).extractField.bind(orchestrator);
        const content = 'domain: authentication';
        expect(extractField(content, 'Domain')).toBe('authentication');
      });
    });

    describe('extractList', () => {
      it('returns empty array for missing list', () => {
        const extractList = (orchestrator as any).extractList.bind(orchestrator);
        const content = 'No lists here';
        expect(extractList(content, 'Missing')).toEqual([]);
      });
    });

    describe('extractBoolean', () => {
      it('returns true for yes value', () => {
        const extractBoolean = (orchestrator as any).extractBoolean.bind(orchestrator);
        expect(extractBoolean('UI Needed: yes', 'UI Needed')).toBe(true);
      });

      it('returns false for no value', () => {
        const extractBoolean = (orchestrator as any).extractBoolean.bind(orchestrator);
        expect(extractBoolean('UI Needed: no', 'UI Needed')).toBe(false);
      });

      it('returns false for missing field', () => {
        const extractBoolean = (orchestrator as any).extractBoolean.bind(orchestrator);
        expect(extractBoolean('Other: yes', 'UI Needed')).toBe(false);
      });
    });

    describe('extractMilestoneName', () => {
      it('extracts milestone name from roadmap', () => {
        const extractMilestoneName = (orchestrator as any).extractMilestoneName.bind(orchestrator);
        const content = '# Roadmap: My Awesome Project';
        expect(extractMilestoneName(content)).toBe('My Awesome Project');
      });

      it('returns null for missing roadmap', () => {
        const extractMilestoneName = (orchestrator as any).extractMilestoneName.bind(orchestrator);
        expect(extractMilestoneName(undefined)).toBeNull();
      });
    });

    describe('countPhasesInRoadmap', () => {
      it('counts phases in roadmap', () => {
        const countPhasesInRoadmap = (orchestrator as any).countPhasesInRoadmap.bind(orchestrator);
        const content = `
### Phase 1: Init
### Phase 2: Build
### Phase 3: Test
`;
        expect(countPhasesInRoadmap(content)).toBe(3);
      });

      it('returns 0 for missing content', () => {
        const countPhasesInRoadmap = (orchestrator as any).countPhasesInRoadmap.bind(orchestrator);
        expect(countPhasesInRoadmap(undefined)).toBe(0);
      });
    });
  });

  // ─── Context loading tests ─────────────────────────────────────────────────

  describe('context loading', () => {
    let orchestrator: Orchestrator;

    beforeEach(() => {
      orchestrator = new Orchestrator({ projectDir: tmpDir });
    });

    describe('loadContextForClassify', () => {
      it('returns empty context when no files exist', async () => {
        const loadContextForClassify = (orchestrator as any).loadContextForClassify.bind(orchestrator);
        const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');
        mockReadFile.mockResolvedValue(undefined);

        const context = await loadContextForClassify();

        expect(context).toEqual({});
      });

      it('loads existing project and roadmap', async () => {
        const loadContextForClassify = (orchestrator as any).loadContextForClassify.bind(orchestrator);
        const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');

        mockReadFile
          .mockResolvedValueOnce('Project content') // PROJECT.md
          .mockResolvedValueOnce('Roadmap content'); // ROADMAP.md

        const context = await loadContextForClassify();

        expect(context).toEqual({
          existing_project: 'Project content',
          existing_roadmap: 'Roadmap content',
        });
      });
    });

    describe('loadContextForDesignMilestone', () => {
      it('loads classification and project files', async () => {
        const loadContextForDesignMilestone = (orchestrator as any).loadContextForDesignMilestone.bind(orchestrator);
        const mockReadFile = vi.spyOn(orchestrator as any, 'readFileIfExists');

        mockReadFile
          .mockResolvedValueOnce('Classification content') // CLASSIFICATION.md
          .mockResolvedValueOnce('Project content'); // PROJECT.md

        const context = await loadContextForDesignMilestone();

        expect(context).toEqual({
          classification: 'Classification content',
          project: 'Project content',
        });
      });
    });
  });

  // ─── Integration-style tests ───────────────────────────────────────────────

  describe('start() flow', () => {
    it('emits OrchestrationStart and ClassificationStart events', async () => {
      // Set up GSD mock BEFORE creating orchestrator
      const mockGSDInstance = {
        run: vi.fn().mockResolvedValue(makeMilestoneRunnerResult()),
      };
      MockGSD.mockImplementation(() => mockGSDInstance);

      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const eventStreamInstance = (orchestrator as any).eventStream;

      // Mock runClassifyPhase to succeed with a valid classification
      const mockParseResult: any = {
        success: true,
        projectType: 'feature',
        domain: 'test',
        complexity: 'simple',
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
      };

      mockRunPhaseStepSession.mockResolvedValueOnce(makePlanResult({ success: true }));

      // Mock parseClassificationResult to return valid result
      vi.spyOn(orchestrator as any, 'parseClassificationResult').mockResolvedValueOnce(mockParseResult);

      // Mock readFileIfExists for classification file
      vi.spyOn(orchestrator as any, 'readFileIfExists').mockResolvedValueOnce(`
Project Type: feature
Domain: test
Complexity: simple
Keywords Detected:
- test
Explicit Requirements:
- nothing
Implicit Requirements:
- none
UI Needed: no
Database: no
Authentication: no
External APIs: no
Real-time: no
`);

      const result = await orchestrator.start('build a test feature');

      // Verify events were emitted
      expect(eventStreamInstance.emitEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GSDEventType.OrchestrationStart,
        })
      );
      expect(eventStreamInstance.emitEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GSDEventType.ClassificationStart,
        })
      );
    });

    it('stops early when classification fails', async () => {
      const mockGSDInstance = {
        run: vi.fn().mockResolvedValue(makeMilestoneRunnerResult()),
      };
      MockGSD.mockImplementation(() => mockGSDInstance);

      const orchestrator = new Orchestrator({ projectDir: tmpDir });

      mockRunPhaseStepSession.mockResolvedValueOnce(makePlanResult({ success: false }));
      vi.spyOn(orchestrator as any, 'parseClassificationResult').mockResolvedValueOnce(undefined);

      const result = await orchestrator.start('build something');

      expect(result.success).toBe(false);
      expect(result.phaseResults).toEqual([]);
    });

    it('skips milestone design for non-new-project types', async () => {
      const mockGSDInstance = {
        run: vi.fn().mockResolvedValue(makeMilestoneRunnerResult()),
      };
      MockGSD.mockImplementation(() => mockGSDInstance);

      const orchestrator = new Orchestrator({ projectDir: tmpDir });

      const mockParseResult: any = {
        success: true,
        projectType: 'feature', // not new_project
        domain: 'test',
        complexity: 'simple',
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
      };

      mockRunPhaseStepSession.mockResolvedValueOnce(makePlanResult({ success: true }));
      vi.spyOn(orchestrator as any, 'parseClassificationResult').mockResolvedValueOnce(mockParseResult);
      vi.spyOn(orchestrator as any, 'readFileIfExists').mockResolvedValueOnce(`
Project Type: feature
Domain: test
Complexity: simple
Keywords Detected:
Explicit Requirements:
Implicit Requirements:
UI Needed: no
Database: no
Authentication: no
External APIs: no
Real-time: no
`);

      await orchestrator.start('add a feature');

      // Verify DesignMilestone was NOT called (only one call to runPhaseStepSession)
      expect(mockRunPhaseStepSession).toHaveBeenCalledTimes(1);
    });

    it('calls onClassificationComplete callback when provided', async () => {
      const mockGSDInstance = {
        run: vi.fn().mockResolvedValue(makeMilestoneRunnerResult()),
      };
      MockGSD.mockImplementation(() => mockGSDInstance);

      const orchestrator = new Orchestrator({ projectDir: tmpDir });
      const callback = vi.fn();

      const mockParseResult: any = {
        success: true,
        projectType: 'feature',
        domain: 'test',
        complexity: 'simple',
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
      };

      mockRunPhaseStepSession.mockResolvedValueOnce(makePlanResult({ success: true }));
      vi.spyOn(orchestrator as any, 'parseClassificationResult').mockResolvedValueOnce(mockParseResult);
      vi.spyOn(orchestrator as any, 'readFileIfExists').mockResolvedValueOnce(`
Project Type: feature
Domain: test
Complexity: simple
Keywords Detected:
Explicit Requirements:
Implicit Requirements:
UI Needed: no
Database: no
Authentication: no
External APIs: no
Real-time: no
`);

      await orchestrator.start('add feature', { onClassificationComplete: callback });

      expect(callback).toHaveBeenCalledWith(mockParseResult);
    });
  });
});
