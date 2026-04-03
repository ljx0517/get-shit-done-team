/**
 * Path Configuration — centralized path resolution for GSD SDK.
 *
 * Design goals:
 * - Project-local installation: <projectDir>/<install_dir>/ (default: .claude/gsdt/)
 * - SDK-builtin fallback: <sdk>/prompts/ (read-only, headless versions)
 * - Global fallback: ~/.gsdt/ (backward compat, no ~/.claude pollution)
 *
 * Priority: project-local > SDK-builtin > global
 *
 * No environment variables — all paths determined by config + project location.
 */

import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default install directory relative to project root. */
export const DEFAULT_INSTALL_DIR = '.claude/gsdt';

/** Default planning directory relative to project root. */
export const DEFAULT_PLANNING_DIR = '.claude/.gsdt-planning';

/** Global fallback base directory (not ~/.claude to avoid conflicts with GSD-1). */
const GLOBAL_FALLBACK_BASE = '.gsdt';

/**
 * Built-in prompts directory within the SDK package.
 * Resolved relative to this file's location.
 */
export const SDK_PROMPTS_DIR = join('.', 'prompts');

// ─── Path Config Interface ───────────────────────────────────────────────────

export interface PathConfig {
  /** Project root directory. */
  projectDir: string;
  /** Base installation directory relative to projectDir. Default: '.claude/gsdt' */
  installDir: string;
}

// ─── Path Resolution ─────────────────────────────────────────────────────────

/**
 * Build the project-local installation base path.
 */
function localBase(projectDir: string, installDir: string): string {
  return join(projectDir, installDir);
}

/**
 * Build the global fallback base path (~/.gsdt by default).
 */
function globalBase(): string {
  return join(homedir(), GLOBAL_FALLBACK_BASE);
}

/**
 * Resolve a path with project-local → SDK-builtin → global priority.
 *
 * @param projectDir - Project root
 * @param installDir - Install directory relative to project (default: '.claude/gsdt')
 * @param relativePath - Path relative to the base (e.g., 'templates', 'agents/gsdt-executor.md')
 * @returns Resolved absolute path
 */
export function resolvePath(
  projectDir: string,
  installDir: string = DEFAULT_INSTALL_DIR,
  relativePath: string = '',
): string {
  const local = join(localBase(projectDir, installDir), relativePath);
  if (existsSync(local)) return local;

  const sdk = join(SDK_PROMPTS_DIR, relativePath);
  if (existsSync(sdk)) return sdk;

  const global = join(globalBase(), relativePath);
  if (existsSync(global)) return global;

  // Return local as default even if it doesn't exist yet (allows creation)
  return local;
}

/**
 * Resolve gsdt-tools binary path.
 * Priority: project-local → global (~/.gsdt/bin/gsdt-tools.cjs)
 *
 * Does NOT fall back to SDK (gsdt-tools is a runtime tool, not a prompt).
 */
export function resolveGsdToolsPath(projectDir: string, installDir: string = DEFAULT_INSTALL_DIR): string {
  const local = join(localBase(projectDir, installDir), 'bin', 'gsdt-tools.cjs');
  if (existsSync(local)) return local;

  const global = join(globalBase(), 'bin', 'gsdt-tools.cjs');
  if (existsSync(global)) return global;

  // Default to local even if doesn't exist (allows init to create it)
  return local;
}

/**
 * Resolve templates directory.
 * Priority: project-local → SDK-builtin → global
 */
export function resolveTemplatesDir(projectDir: string, installDir: string = DEFAULT_INSTALL_DIR): string {
  return resolvePath(projectDir, installDir, 'templates');
}

/**
 * Resolve agents directory.
 * Priority: project-local → SDK-builtin → global
 */
export function resolveAgentsDir(projectDir: string, installDir: string = DEFAULT_INSTALL_DIR): string {
  return resolvePath(projectDir, installDir, 'agents');
}

/**
 * Resolve workflows directory.
 * Priority: project-local → SDK-builtin → global
 */
export function resolveWorkflowsDir(projectDir: string, installDir: string = DEFAULT_INSTALL_DIR): string {
  return resolvePath(projectDir, installDir, 'workflows');
}

/**
 * Resolve the planning directory path.
 * Can be overridden via config for projects that want a different directory name.
 */
export function resolvePlanningDir(
  projectDir: string,
  planningDir: string = DEFAULT_PLANNING_DIR,
): string {
  return join(projectDir, planningDir);
}

/**
 * Get all resolution candidates for a given relative path.
 * Useful for debugging or displaying available sources.
 */
export function getPathCandidates(
  projectDir: string,
  installDir: string = DEFAULT_INSTALL_DIR,
  relativePath: string = '',
): { source: string; path: string; exists: boolean }[] {
  return [
    { source: 'local', path: join(localBase(projectDir, installDir), relativePath), exists: existsSync(join(localBase(projectDir, installDir), relativePath)) },
    { source: 'sdk', path: join(SDK_PROMPTS_DIR, relativePath), exists: existsSync(join(SDK_PROMPTS_DIR, relativePath)) },
    { source: 'global', path: join(globalBase(), relativePath), exists: existsSync(join(globalBase(), relativePath)) },
  ];
}
