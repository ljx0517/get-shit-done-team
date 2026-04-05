/**
 * Skill: classify-context-loader
 *
 * Dynamically determines which context files the Classify phase needs,
 * based on project state. Decouples file discovery from hardcoded logic.
 */

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { constants } from 'node:fs';

import { resolvePlanningDir } from './path-config.js';

export interface ClassifyContext {
  needsProjectFile: boolean;  // Load PROJECT.md as 'existing_project'
  needsRoadmapFile: boolean;  // Load ROADMAP.md as 'existing_roadmap'
  needsStateFile: boolean;    // Load STATE.md as 'project_state'
  projectExists: boolean;      // True if any .gsdt-planning files exist
}

export interface LoadedClassifyContext {
  context: ClassifyContext;
  files: Record<string, string>;  // 'existing_project' | 'existing_roadmap' | 'project_state' -> content
}

/**
 * Check if a file exists (async, non-throwing)
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine what context the Classify phase needs, based on project state.
 *
 * @param projectDir - The project directory
 * @returns ClassifyContext describing which files should be loaded
 *
 * @example
 * ```typescript
 * const context = await ClassifyContextLoader.determineContext('/path/to/project');
 * if (context.projectExists) {
 *   // Project already exists - may need existing project context
 * }
 * ```
 */
export async function determineClassifyContext(projectDir: string): Promise<ClassifyContext> {
  const planningDir = resolvePlanningDir(projectDir);
  const projectPath = join(planningDir, 'PROJECT.md');
  const roadmapPath = join(planningDir, 'ROADMAP.md');
  const statePath = join(planningDir, 'STATE.md');

  // Parallel existence checks for performance
  const [hasProject, hasRoadmap, hasState] = await Promise.all([
    fileExists(projectPath),
    fileExists(roadmapPath),
    fileExists(statePath),
  ]);

  const projectExists = hasProject || hasRoadmap || hasState;

  return {
    needsProjectFile: hasProject,
    needsRoadmapFile: hasRoadmap,
    needsStateFile: hasState,
    projectExists,
  };
}

/**
 * Load the actual context files based on ClassifyContext decision.
 *
 * @param projectDir - The project directory
 * @param context - The context decision from determineClassifyContext
 * @returns LoadedClassifyContext with both the decision and file contents
 *
 * @example
 * ```typescript
 * const contextDecision = await determineClassifyContext(projectDir);
 * const { context, files } = await loadClassifyContextFiles(projectDir, contextDecision);
 * // files = { existing_project: '...', existing_roadmap: '...' }
 * ```
 */
export async function loadClassifyContextFiles(
  projectDir: string,
  context: ClassifyContext
): Promise<LoadedClassifyContext> {
  const planningDir = resolvePlanningDir(projectDir);
  const files: Record<string, string> = {};

  // Load only the files that are needed and exist
  const loadPromises: Array<{ key: string; path: string }> = [];

  if (context.needsProjectFile) {
    loadPromises.push({ key: 'existing_project', path: join(planningDir, 'PROJECT.md') });
  }
  if (context.needsRoadmapFile) {
    loadPromises.push({ key: 'existing_roadmap', path: join(planningDir, 'ROADMAP.md') });
  }
  if (context.needsStateFile) {
    loadPromises.push({ key: 'project_state', path: join(planningDir, 'STATE.md') });
  }

  // Load all files in parallel
  const loadedFiles = await Promise.all(
    loadPromises.map(async ({ key, path }) => {
      try {
        const content = await readFile(path, 'utf-8');
        return { key, content };
      } catch {
        return { key, content: undefined };
      }
    })
  );

  for (const { key, content } of loadedFiles) {
    if (content !== undefined) {
      files[key] = content;
    }
  }

  return { context, files };
}

/**
 * Build PHASE_FILE_MANIFEST entry for Classify phase dynamically.
 *
 * This replaces the hardcoded empty array with dynamic detection.
 *
 * @param projectDir - The project directory
 * @returns FileSpec array for PhaseType.Classify
 *
 * @example
 * ```typescript
 * const manifest = await buildClassifyManifest('/path/to/project');
 * // Returns: [
 * //   { key: 'project', filename: 'PROJECT.md', required: false },
 * //   { key: 'roadmap', filename: 'ROADMAP.md', required: false },
 * //   ...
 * // ]
 * ```
 */
export async function buildClassifyManifest(projectDir: string): Promise<
  Array<{ key: string; filename: string; required: boolean }>
> {
  const context = await determineClassifyContext(projectDir);
  const manifest: Array<{ key: string; filename: string; required: boolean }> = [];

  if (context.needsProjectFile) {
    manifest.push({ key: 'project', filename: 'PROJECT.md', required: false });
  }
  if (context.needsRoadmapFile) {
    manifest.push({ key: 'roadmap', filename: 'ROADMAP.md', required: false });
  }
  if (context.needsStateFile) {
    manifest.push({ key: 'state', filename: 'STATE.md', required: false });
  }

  return manifest;
}

/**
 * ClassifyContextLoader - Main skill interface
 */
export const ClassifyContextLoader = {
  determineContext: determineClassifyContext,
  loadFiles: loadClassifyContextFiles,
  buildManifest: buildClassifyManifest,
};
