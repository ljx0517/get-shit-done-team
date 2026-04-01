# Skill: tool-scope-resolver

## Purpose

Resolves which tools (Read, Write, Edit, Bash, etc.) are available for each phase type. Enforces tool access control per R015: different phases get different tool sets.

## Triggers

When the SDK needs to determine which tools are available for a phase:
- Before spawning an agent for a phase
- When validating tool access permissions
- When parsing agent definition files

## Input Schema

```typescript
interface ToolScopeInput {
  phaseType: PhaseType;
  agentDef?: string;  // Optional agent definition to parse tools from
  context?: {
    has_write_access?: boolean;
    is_experimental?: boolean;
  };
}
```

## Output Schema

```typescript
interface ToolScopeOutput {
  tools: string[];
  reason: string;
  restrictions: string[];
}
```

## Decision Rules

### Phase → Default Tools

| Phase | Default Tools | Restrictions |
|-------|-------------|--------------|
| Classify | Read, Bash, Grep, Glob | No Write/Edit |
| DesignMilestone | Read, Write, Bash, Glob, Grep | No Edit |
| Research | Read, Grep, Glob, Bash, WebSearch | No Write/Edit |
| Execute | Read, Write, Edit, Bash, Grep, Glob | No restrictions |
| Verify | Read, Bash, Grep, Glob | No Write/Edit |
| Discuss | Read, Bash, Grep, Glob | No Write/Edit |
| Plan | Read, Write, Bash, Glob, Grep, WebFetch | No Edit |

### Phase → Agent Definition Mapping

| Phase | Agent Definition File |
|-------|----------------------|
| Classify | gsdt-classifier.md |
| DesignMilestone | gsdt-roadmapper.md |
| Research | gsdt-phase-researcher.md |
| Plan | gsdt-planner.md |
| Execute | gsdt-executor.md |
| Verify | gsdt-verifier.md |
| Discuss | null (no dedicated agent) |

### Tool Override Logic

1. If `agentDef` is provided → parse tools from agent frontmatter using `parseAgentTools()`
2. Otherwise → use `PHASE_DEFAULT_TOOLS` for the phase type
3. If `context.has_write_access === false` → remove Write/Edit from tools
4. If `context.is_experimental === true` → add experimental tools (if any)

## Usage

```typescript
import { getToolsForPhase, PHASE_DEFAULT_TOOLS } from './tool-scope-resolver.js';

// Get default tools for a phase
const tools = getToolsForPhase(PhaseType.Research);

// Override with agent definition
const toolsFromAgent = getToolsForPhase(PhaseType.Execute, agentDefContent);

// Access the decision table directly
const defaults = PHASE_DEFAULT_TOOLS[PhaseType.Research];
```

## Design Rationale

- **R015 Compliance**: Tool scoping is enforced at the skill level, not hardcoded in multiple places
- **Consistent**: All phase tool access goes through this skill with clear audit trail
- **Extensible**: Easy to add new phases or modify tool sets without touching multiple files
- **AI-friendly**: Skill output is structured, easy for AI to consume and generate

## References

- R015: Phase tool access control
- `prompt-builder.ts`: `parseAgentTools()` for parsing agent frontmatter
