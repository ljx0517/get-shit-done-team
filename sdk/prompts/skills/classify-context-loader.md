# Skill: classify-context-loader

## Purpose

Dynamically determines which context files the Classify phase needs, based on project state.

## Triggers

When the Orchestrator needs to run the Classify phase, this skill decides:
1. Does the project already exist? (has `.claude/.gsdt-planning/PROJECT.md`)
2. Does it have a roadmap? (has `.claude/.gsdt-planning/ROADMAP.md`)
3. Does it have recent state? (has `.claude/.gsdt-planning/STATE.md`)
4. Based on these answers, which files should be loaded as context?

## Context Files

### Existing project context

If `PROJECT.md` exists, the classifier should understand:
- What kind of project this is
- What the original goal was
- Current development stage

If `ROADMAP.md` exists, the classifier should understand:
- What phases have been planned
- What's already been completed
- What's remaining

If `STATE.md` exists, the classifier should understand:
- Current project state
- Active work items
- Blockers or notes

### New project context

If no project files exist, the classifier starts fresh without any context.

## Decision Logic

```typescript
interface ClassifyContext {
  needsProjectFile: boolean;  // Load PROJECT.md as 'existing_project'
  needsRoadmapFile: boolean;  // Load ROADMAP.md as 'existing_roadmap'
  needsStateFile: boolean;    // Load STATE.md as 'project_state'
  projectExists: boolean;     // True if any .claude/.gsdt-planning files exist
}

function determineClassifyContext(projectDir: string): ClassifyContext {
  const hasProject = exists(join(projectDir, '.claude/.gsdt-planning', 'PROJECT.md'));
  const hasRoadmap = exists(join(projectDir, '.claude/.gsdt-planning', 'ROADMAP.md'));
  const hasState = exists(join(projectDir, '.claude/.gsdt-planning', 'STATE.md'));
  const projectExists = hasProject || hasRoadmap || hasState;

  return {
    needsProjectFile: hasProject,
    needsRoadmapFile: hasRoadmap,
    needsStateFile: hasState,
    projectExists,
  };
}
```

## Output

Returns a `ClassifyContext` object that the Orchestrator uses to:
1. Decide which files to load via `loadContextForClassify()`
2. Populate `PHASE_FILE_MANIFEST[PhaseType.Classify]` dynamically

## Usage

The Orchestrator calls this skill before running the Classify phase:

```typescript
const context = await classifyContextLoader.determineContext(projectDir);
const contextFiles = await loadContextFiles(context);
const prompt = await promptFactory.buildPrompt(PhaseType.Classify, null, contextFiles);
```

## Design Rationale

- **Decoupled**: File discovery logic lives in the skill, not in Orchestrator
- **Extensible**: Easy to add new context sources (e.g., `TASKS.md`, `.git/log`)
- **Consistent**: Both `loadContextForClassify()` and `PHASE_FILE_MANIFEST` use the same decision logic
- **Minimal I/O**: Only loads files that actually exist (async file existence checks)
