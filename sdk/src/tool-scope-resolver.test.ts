import { describe, it, expect } from 'vitest';
import { getToolsForPhase, PHASE_DEFAULT_TOOLS, resolveToolScope } from './tool-scope-resolver.js';
import { PhaseType } from './types.js';

describe('ToolScopeResolver', () => {
  describe('PHASE_DEFAULT_TOOLS', () => {
    it('Research phase has read-only tools + WebSearch', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Research];
      expect(tools).toContain('Read');
      expect(tools).toContain('Grep');
      expect(tools).toContain('Glob');
      expect(tools).toContain('Bash');
      expect(tools).toContain('WebSearch');
      expect(tools).not.toContain('Write');
      expect(tools).not.toContain('Edit');
    });

    it('Execute phase has full read/write tools', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Execute];
      expect(tools).toContain('Read');
      expect(tools).toContain('Write');
      expect(tools).toContain('Edit');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Grep');
      expect(tools).toContain('Glob');
    });

    it('Verify phase has read-only tools', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Verify];
      expect(tools).toContain('Read');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Grep');
      expect(tools).toContain('Glob');
      expect(tools).not.toContain('Write');
      expect(tools).not.toContain('Edit');
    });

    it('Discuss phase has read-only tools', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Discuss];
      expect(tools).toContain('Read');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Grep');
      expect(tools).toContain('Glob');
      expect(tools).not.toContain('Write');
      expect(tools).not.toContain('Edit');
    });

    it('Plan phase has read/write but no Edit', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Plan];
      expect(tools).toContain('Read');
      expect(tools).toContain('Write');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Glob');
      expect(tools).toContain('Grep');
      expect(tools).toContain('WebFetch');
      expect(tools).not.toContain('Edit');
    });

    it('Classify phase has read-only tools', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.Classify];
      expect(tools).toContain('Read');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Grep');
      expect(tools).toContain('Glob');
      expect(tools).not.toContain('Write');
      expect(tools).not.toContain('Edit');
    });

    it('DesignMilestone phase has read/write but no Edit', () => {
      const tools = PHASE_DEFAULT_TOOLS[PhaseType.DesignMilestone];
      expect(tools).toContain('Read');
      expect(tools).toContain('Write');
      expect(tools).toContain('Bash');
      expect(tools).toContain('Glob');
      expect(tools).toContain('Grep');
      expect(tools).not.toContain('Edit');
    });
  });

  describe('getToolsForPhase()', () => {
    it('returns default tools when no agentDef provided', () => {
      const tools = getToolsForPhase(PhaseType.Research);
      expect(tools).toEqual(PHASE_DEFAULT_TOOLS[PhaseType.Research]);
    });

    it('returns copy of default tools (not mutated)', () => {
      const tools1 = getToolsForPhase(PhaseType.Research);
      const tools2 = getToolsForPhase(PhaseType.Research);
      expect(tools1).not.toBe(tools2);
      expect(tools1).toEqual(tools2);
    });
  });

  describe('resolveToolScope()', () => {
    it('returns default tools with reason when no agentDef', () => {
      const result = resolveToolScope({ phaseType: PhaseType.Research });
      expect(result.tools).toEqual(PHASE_DEFAULT_TOOLS[PhaseType.Research]);
      expect(result.reason).toContain('default tools');
      expect(result.restrictions).toEqual([]);
    });

    it('applies write_access restriction', () => {
      const result = resolveToolScope({
        phaseType: PhaseType.Execute,
        context: { has_write_access: false },
      });
      expect(result.tools).not.toContain('Write');
      expect(result.tools).not.toContain('Edit');
      expect(result.restrictions).toContain('No Write/Edit (has_write_access=false)');
    });

    it('does not apply restriction when has_write_access is true', () => {
      const result = resolveToolScope({
        phaseType: PhaseType.Execute,
        context: { has_write_access: true },
      });
      expect(result.tools).toContain('Write');
      expect(result.tools).toContain('Edit');
    });
  });
});
