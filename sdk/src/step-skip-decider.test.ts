import { describe, it, expect } from 'vitest';
import { StepSkipDecider } from './step-skip-decider.js';

type StepType = 'discuss' | 'research' | 'plan' | 'plan_check' | 'execute' | 'verify' | 'advance';

interface TestPhaseOp {
  has_context: boolean;
  has_plans: boolean;
  plan_count: number;
  has_research: boolean;
  has_verification: boolean;
}

interface TestConfig {
  skip_discuss: boolean;
  auto_advance: boolean;
  research: boolean;
  plan_check: boolean;
  verifier: boolean;
}

function makeInput(
  step: StepType,
  phaseOp: Partial<TestPhaseOp>,
  config: Partial<TestConfig>
) {
  return {
    phaseOp: {
      has_context: false,
      has_plans: false,
      plan_count: 0,
      has_research: false,
      has_verification: false,
      ...phaseOp,
    },
    config: {
      skip_discuss: false,
      auto_advance: false,
      research: true,
      plan_check: true,
      verifier: true,
      ...config,
    },
    previousStepResults: [],
    currentStep: step,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('StepSkipDecider.decide()', () => {
  describe('discuss step', () => {
    it('skip when has_context=true', () => {
      const input = makeInput('discuss', { has_context: true }, {});
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('self_discuss when has_context=false and auto_advance=true and skip_discuss=false', () => {
      const input = makeInput('discuss', { has_context: false }, { auto_advance: true, skip_discuss: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('self_discuss');
    });

    it('self_discuss when has_context=false and skip_discuss=true and auto_advance=true', () => {
      const input = makeInput('discuss', { has_context: false }, { skip_discuss: true, auto_advance: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('self_discuss');
    });

    it('run when has_context=false and skip_discuss=false and auto_advance=false', () => {
      const input = makeInput('discuss', { has_context: false }, { skip_discuss: false, auto_advance: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('skip when has_context=true and skip_discuss=true', () => {
      const input = makeInput('discuss', { has_context: true }, { skip_discuss: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('skip when skip_discuss=true and auto_advance=false and has_context=false', () => {
      const input = makeInput('discuss', { has_context: false }, { skip_discuss: true, auto_advance: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('reEvaluate=true when no context exists (run or self_discuss)', () => {
      const inputRun = makeInput('discuss', { has_context: false }, { skip_discuss: false, auto_advance: false });
      const inputSelf = makeInput('discuss', { has_context: false }, { skip_discuss: false, auto_advance: true });
      expect(StepSkipDecider.decide(inputRun).reEvaluate).toBe(true);
      expect(StepSkipDecider.decide(inputSelf).reEvaluate).toBe(true);
    });

    it('reEvaluate=false when has_context=true', () => {
      const input = makeInput('discuss', { has_context: true }, {});
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });

  describe('research step', () => {
    it('skip when config.research=false', () => {
      const input = makeInput('research', {}, { research: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('run when config.research=true', () => {
      const input = makeInput('research', {}, { research: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('reEvaluate=false for research', () => {
      const input = makeInput('research', {}, { research: true });
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });

  describe('plan step', () => {
    it('always run', () => {
      const input = makeInput('plan', {}, {});
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('reEvaluate=true for plan (to check if plans were created)', () => {
      const input = makeInput('plan', {}, {});
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(true);
    });
  });

  describe('plan_check step', () => {
    it('run when config.plan_check=true', () => {
      const input = makeInput('plan_check', {}, { plan_check: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('skip when config.plan_check=false', () => {
      const input = makeInput('plan_check', {}, { plan_check: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('reEvaluate=false for plan_check', () => {
      const input = makeInput('plan_check', {}, { plan_check: true });
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });

  describe('execute step', () => {
    it('always run regardless of has_plans', () => {
      const input1 = makeInput('execute', { has_plans: false, plan_count: 0 }, {});
      const input2 = makeInput('execute', { has_plans: true, plan_count: 5 }, {});
      expect(StepSkipDecider.decide(input1).action).toBe('run');
      expect(StepSkipDecider.decide(input2).action).toBe('run');
    });

    it('reEvaluate=false for execute', () => {
      const input = makeInput('execute', {}, {});
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });

  describe('verify step', () => {
    it('skip when config.verifier=false', () => {
      const input = makeInput('verify', {}, { verifier: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('skip');
    });

    it('run when config.verifier=true', () => {
      const input = makeInput('verify', {}, { verifier: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('reEvaluate=false for verify', () => {
      const input = makeInput('verify', {}, { verifier: true });
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });

  describe('advance step', () => {
    it('run when auto_advance=true', () => {
      const input = makeInput('advance', {}, { auto_advance: true });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    // Advance always runs - the actual halt/auto-approve logic is handled
    // inside runAdvanceStep via callbacks, not in the skip decider
    it('run when auto_advance=false (human confirmation handled in runAdvanceStep)', () => {
      const input = makeInput('advance', {}, { auto_advance: false });
      const result = StepSkipDecider.decide(input);
      expect(result.action).toBe('run');
    });

    it('reEvaluate=false for advance', () => {
      const input = makeInput('advance', {}, { auto_advance: true });
      expect(StepSkipDecider.decide(input).reEvaluate).toBe(false);
    });
  });
});

describe('StepSkipDecider.getBlockerGuidance()', () => {
  describe('discuss blocker', () => {
    it('skip when no context and auto_advance=true', () => {
      const result = StepSkipDecider.getBlockerGuidance('discuss', false, false, 0, { auto_advance: true });
      expect(result.decision).toBe('skip');
    });

    it('stop when no context and auto_advance=false', () => {
      const result = StepSkipDecider.getBlockerGuidance('discuss', false, false, 0, { auto_advance: false });
      expect(result.decision).toBe('stop');
    });
  });

  describe('plan blocker', () => {
    it('retry when no plans and auto_advance=true', () => {
      const result = StepSkipDecider.getBlockerGuidance('plan', false, false, 0, { auto_advance: true });
      expect(result.decision).toBe('retry');
    });

    it('stop when no plans and auto_advance=false', () => {
      const result = StepSkipDecider.getBlockerGuidance('plan', false, false, 0, { auto_advance: false });
      expect(result.decision).toBe('stop');
    });

    it('skip when plans exist', () => {
      const result = StepSkipDecider.getBlockerGuidance('plan', false, true, 5, { auto_advance: true });
      expect(result.decision).toBe('skip');
    });
  });

  describe('verify blocker', () => {
    it('returns default skip (gap closure handled separately)', () => {
      const result = StepSkipDecider.getBlockerGuidance('verify', false, false, 0, { auto_advance: true });
      expect(result.decision).toBe('skip');
    });
  });
});

describe('decision reasons are descriptive', () => {
  it('all decisions have non-empty reason', () => {
    const steps: StepType[] = ['discuss', 'research', 'plan', 'plan_check', 'execute', 'verify', 'advance'];
    const configs: TestConfig[] = [
      { skip_discuss: false, auto_advance: false, research: false, plan_check: false, verifier: false },
      { skip_discuss: true, auto_advance: true, research: true, plan_check: true, verifier: true },
    ];

    for (const step of steps) {
      for (const config of configs) {
        const input = makeInput(step, { has_context: true }, config);
        const result = StepSkipDecider.decide(input);
        expect(result.reason.length).toBeGreaterThan(0);
      }
    }
  });
});
