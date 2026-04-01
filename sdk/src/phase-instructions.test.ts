import { describe, it, expect } from 'vitest';
import { getPhaseInstructions } from './phase-instructions.js';
import { PhaseType } from './types.js';

describe('PhaseInstructions', () => {
  describe('getPhaseInstructions()', () => {
    describe('phase-specific instructions', () => {
      it('Classify returns analysis instruction', () => {
        const result = getPhaseInstructions(PhaseType.Classify);
        expect(result.instruction).toContain('Analyze the user input');
        expect(result.instruction).toContain('CLASSIFICATION.md');
      });

      it('DesignMilestone returns roadmap instruction', () => {
        const result = getPhaseInstructions(PhaseType.DesignMilestone);
        expect(result.instruction).toContain('Design the project roadmap');
        expect(result.instruction).toContain('ROADMAP.md');
        expect(result.instruction).toContain('goal-backward');
      });

      it('Research returns investigation instruction', () => {
        const result = getPhaseInstructions(PhaseType.Research);
        expect(result.instruction).toContain('technical investigation');
        expect(result.instruction).toContain('Do not modify source files');
        expect(result.instruction).toContain('RESEARCH.md');
      });

      it('Plan returns planning instruction', () => {
        const result = getPhaseInstructions(PhaseType.Plan);
        expect(result.instruction).toContain('executable plans');
        expect(result.instruction).toContain('task breakdown');
        expect(result.instruction).toContain('acceptance criteria');
      });

      it('Verify returns verification instruction', () => {
        const result = getPhaseInstructions(PhaseType.Verify);
        expect(result.instruction).toContain('Verify goal achievement');
        expect(result.instruction).toContain('not just task completion');
        expect(result.instruction).toContain('VERIFICATION.md');
      });

      it('Discuss returns decision extraction instruction', () => {
        const result = getPhaseInstructions(PhaseType.Discuss);
        expect(result.instruction).toContain('Extract implementation decisions');
        expect(result.instruction).toContain('gray areas');
      });

      it('Execute returns empty instruction', () => {
        const result = getPhaseInstructions(PhaseType.Execute);
        expect(result.instruction).toBe('');
        expect(result.tips).toEqual([]);
        expect(result.examples).toEqual([]);
      });
    });

    describe('context modifiers', () => {
      it('is_new_project: false adds context tip', () => {
        const result = getPhaseInstructions(PhaseType.Classify, { is_new_project: false });
        expect(result.tips).toContain('If project exists, read existing context first before making changes');
      });

      it('complexity: high adds thoroughness tip', () => {
        const result = getPhaseInstructions(PhaseType.Research, { complexity: 'high' });
        expect(result.tips).toContain('Allow extra time for thorough investigation and testing');
      });

      it('has_existing_context adds use-existing tip', () => {
        const result = getPhaseInstructions(PhaseType.Plan, { has_existing_context: true });
        expect(result.tips).toContain('Use existing context, do not regenerate duplicate artifacts');
      });

      it('combines multiple context modifiers', () => {
        const result = getPhaseInstructions(PhaseType.Research, {
          is_new_project: false,
          complexity: 'high',
          has_existing_context: true,
        });
        expect(result.tips).toContain('If project exists, read existing context first before making changes');
        expect(result.tips).toContain('Allow extra time for thorough investigation and testing');
        expect(result.tips).toContain('Use existing context, do not regenerate duplicate artifacts');
      });
    });

    describe('tips and examples', () => {
      it('returns tips for each phase', () => {
        const result = getPhaseInstructions(PhaseType.Research);
        expect(result.tips.length).toBeGreaterThan(0);
      });

      it('returns examples for each phase', () => {
        const result = getPhaseInstructions(PhaseType.Research);
        expect(result.examples.length).toBeGreaterThan(0);
      });

      it('Execute returns empty tips and examples', () => {
        const result = getPhaseInstructions(PhaseType.Execute);
        expect(result.tips).toEqual([]);
        expect(result.examples).toEqual([]);
      });
    });
  });
});
