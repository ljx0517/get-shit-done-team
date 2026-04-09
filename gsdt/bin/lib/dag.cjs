/**
 * DAG — Dependency graph validation utilities
 * Provides cycle detection, wave consistency checks, and file conflict detection
 * for plan dependency graphs. Inspired by OpenSpec's artifact-graph module.
 */

/**
 * DFS-based cycle detection on plan dependency graph.
 * @param {Array<{id: string, depends_on: string[]}>} plans
 * @returns {string|null} cycle path like "A → B → C → A" or null if no cycle
 */
function detectCycles(plans) {
  const planMap = new Map(plans.map(p => [p.id, p]));
  const visited = new Set();
  const inStack = new Set();
  const parent = new Map();

  function dfs(id) {
    visited.add(id);
    inStack.add(id);

    const plan = planMap.get(id);
    if (!plan) { inStack.delete(id); return null; }

    const deps = plan.depends_on || [];
    for (const dep of deps) {
      if (!planMap.has(dep)) continue; // unknown dep, skip
      if (!visited.has(dep)) {
        parent.set(dep, id);
        const cycle = dfs(dep);
        if (cycle) return cycle;
      } else if (inStack.has(dep)) {
        // Reconstruct cycle path
        const cyclePath = [dep];
        let current = id;
        while (current !== dep) {
          cyclePath.unshift(current);
          current = parent.get(current);
        }
        cyclePath.unshift(dep);
        return cyclePath.join(' → ');
      }
    }

    inStack.delete(id);
    return null;
  }

  for (const plan of plans) {
    if (!visited.has(plan.id)) {
      const cycle = dfs(plan.id);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * Validates that wave numbering is consistent with depends_on.
 * If plan B depends_on plan A, then B.wave must be > A.wave.
 * @param {Array<{id: string, wave: number, depends_on: string[]}>} plans
 * @returns {string[]} warning messages
 */
function validateWaveConsistency(plans) {
  const planMap = new Map(plans.map(p => [p.id, p]));
  const warnings = [];

  for (const plan of plans) {
    for (const depId of (plan.depends_on || [])) {
      const dep = planMap.get(depId);
      if (dep && plan.wave <= dep.wave) {
        warnings.push(
          `${plan.id} (wave ${plan.wave}) depends_on ${depId} (wave ${dep.wave}) — wave should be greater`
        );
      }
    }
  }
  return warnings;
}

/**
 * Detects file conflicts: same file modified by multiple plans in the same wave.
 * @param {Array<{id: string, wave: number, files_modified: string[]}>} plans
 * @returns {string[]} warning messages
 */
function validateFileConflicts(plans) {
  const warnings = [];
  const fileToPlans = new Map();

  for (const plan of plans) {
    for (const file of (plan.files_modified || [])) {
      if (!fileToPlans.has(file)) fileToPlans.set(file, []);
      fileToPlans.get(file).push({ id: plan.id, wave: plan.wave });
    }
  }

  for (const [file, planEntries] of fileToPlans) {
    if (planEntries.length > 1) {
      const waveGroups = new Map();
      for (const entry of planEntries) {
        if (!waveGroups.has(entry.wave)) waveGroups.set(entry.wave, []);
        waveGroups.get(entry.wave).push(entry.id);
      }
      for (const [wave, ids] of waveGroups) {
        if (ids.length > 1) {
          warnings.push(`File "${file}" modified by multiple plans in wave ${wave}: ${ids.join(', ')}`);
        }
      }
    }
  }
  return warnings;
}

module.exports = {
  detectCycles,
  validateWaveConsistency,
  validateFileConflicts,
};
