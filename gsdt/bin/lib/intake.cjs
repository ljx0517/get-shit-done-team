/**
 * Intake — Semantic-first raw input storage, ledger merging, and readiness routing.
 *
 * Design: NO natural-language understanding here.
 * Workflow prompt produces normalized units; this module handles I/O + scoring.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  planningPaths,
  output,
  error,
  extractCurrentMilestone,
  toPosixPath,
} = require('./core.cjs');

function intakePaths(cwd) {
  const planning = planningPaths(cwd);
  const intakeRoot = path.join(cwd, '.claude', '.gsdt-intake');
  return {
    intakeRoot,
    rawDir: path.join(intakeRoot, 'raw'),
    ledgerPath: path.join(intakeRoot, 'ledger.json'),
    cardsPath: path.join(intakeRoot, 'cards.md'),
    briefPath: path.join(intakeRoot, 'brief.md'),
    readinessPath: path.join(intakeRoot, 'readiness.json'),
    planningRoot: planning.planning,
    roadmapPath: planning.roadmap,
    statePath: planning.state,
    projectPath: planning.project,
    requirementsPath: planning.requirements,
    phasesDir: planning.phases,
  };
}

function ensureIntakeRoot(cwd) {
  const paths = intakePaths(cwd);
  fs.mkdirSync(paths.rawDir, { recursive: true });
  return paths;
}

function withIntakeLock(cwd, fn) {
  const paths = ensureIntakeRoot(cwd);
  const lockPath = path.join(paths.intakeRoot, '.lock');
  const start = Date.now();
  const timeoutMs = 10000;

  while (Date.now() - start < timeoutMs) {
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      try {
        return fn();
      } finally {
        try { fs.unlinkSync(lockPath); } catch {}
      }
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      try {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > 30000) {
          fs.unlinkSync(lockPath);
          continue;
        }
      } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }

  try { fs.unlinkSync(lockPath); } catch {}
  return fn();
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function countRawFiles(rawDir) {
  try {
    return fs.readdirSync(rawDir).filter(f => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function nextRawName(rawDir) {
  const today = new Date().toISOString().slice(0, 10);
  let seq = 1;
  if (fs.existsSync(rawDir)) {
    const existing = fs.readdirSync(rawDir).filter(f => f.startsWith(today) && f.endsWith('.md'));
    seq = existing.length + 1;
  }
  return `${today}-${String(seq).padStart(3, '0')}.md`;
}

function toRawId(filename) {
  return `RAW-${path.basename(filename, '.md')}`;
}

function parsePhaseValue(value) {
  return /^\d+$/.test(String(value)) ? Number(value) : String(value);
}

function parseRoadmapPhases(roadmapPath) {
  if (!fs.existsSync(roadmapPath)) return [];

  const raw = fs.readFileSync(roadmapPath, 'utf8');
  const content = extractCurrentMilestone(raw, path.dirname(path.dirname(path.dirname(roadmapPath))));
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phases = [];
  let match;
  while ((match = phasePattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();
    const sectionStart = match.index;
    const rest = content.slice(sectionStart);
    const nextHeader = rest.match(/\n#{2,4}\s*Phase\s+\d/i);
    const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
    const section = content.slice(sectionStart, sectionEnd);
    const goalMatch = section.match(/\*\*Goal(?::\*\*|\*\*:)\s*([^\n]+)/i);
    phases.push({
      number: phaseNum,
      name: phaseName,
      goal: goalMatch ? goalMatch[1].trim() : '',
      section,
    });
  }
  return phases;
}

function findPhaseDir(phasesDir, phaseNumber) {
  if (!fs.existsSync(phasesDir)) return null;
  const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  const phaseStr = String(phaseNumber);
  const padded = /^\d+$/.test(phaseStr) ? phaseStr.padStart(2, '0') : phaseStr;
  return dirs.find(d => d === padded || d.startsWith(`${padded}-`) || d.startsWith(`${phaseStr}-`)) || null;
}

function computeDiskPhaseStatus(phasesDir, phaseNumber) {
  const dirName = findPhaseDir(phasesDir, phaseNumber);
  if (!dirName) {
    return {
      dirName: null,
      status: 'no_directory',
      hasPlan: false,
      hasContext: false,
      hasResearch: false,
      planCount: 0,
      summaryCount: 0,
    };
  }

  const phasePath = path.join(phasesDir, dirName);
  const files = fs.readdirSync(phasePath);
  const planCount = files.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
  const summaryCount = files.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;
  const hasContext = files.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
  const hasResearch = files.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

  let status = 'empty';
  if (summaryCount >= planCount && planCount > 0) status = 'complete';
  else if (summaryCount > 0) status = 'partial';
  else if (planCount > 0) status = 'planned';
  else if (hasResearch) status = 'researched';
  else if (hasContext) status = 'discussed';

  return {
    dirName,
    status,
    hasPlan: planCount > 0,
    hasContext,
    hasResearch,
    planCount,
    summaryCount,
  };
}

function loadPlanningSnapshot(cwd) {
  const paths = intakePaths(cwd);
  const roadmapExists = fs.existsSync(paths.roadmapPath);
  const projectExists =
    roadmapExists ||
    fs.existsSync(paths.projectPath) ||
    fs.existsSync(paths.requirementsPath) ||
    fs.existsSync(paths.statePath);

  const phases = parseRoadmapPhases(paths.roadmapPath).map(phase => {
    const disk = computeDiskPhaseStatus(paths.phasesDir, phase.number);
    return {
      number: phase.number,
      name: phase.name,
      goal: phase.goal,
      status: disk.status,
      has_plan: disk.hasPlan,
      has_context: disk.hasContext,
      dir_name: disk.dirName,
    };
  });

  const phaseDirs = {};
  const existingPlansByPhase = {};
  const phaseStatuses = {};
  for (const phase of phases) {
    phaseDirs[String(phase.number)] = phase.dir_name ? path.join(paths.phasesDir, phase.dir_name) : null;
    existingPlansByPhase[String(phase.number)] = phase.has_plan;
    phaseStatuses[String(phase.number)] = phase.status;
  }

  const active = phases.find(p => p.status !== 'complete');

  return {
    project_exists: projectExists,
    roadmap_exists: roadmapExists,
    active_phase: active ? parsePhaseValue(active.number) : null,
    phase_dirs: phaseDirs,
    existing_plans_by_phase: existingPlansByPhase,
    phase_statuses: phaseStatuses,
    phases,
  };
}

function defaultLedger() {
  return {
    version: 1,
    updated_at: null,
    raw_count: 0,
    unit_count: 0,
    units: [],
  };
}

function loadLedger(ledgerPath) {
  const ledger = safeReadJson(ledgerPath, defaultLedger());
  if (!Array.isArray(ledger.units)) ledger.units = [];
  if (typeof ledger.raw_count !== 'number') ledger.raw_count = 0;
  ledger.unit_count = ledger.units.length;
  return ledger;
}

function saveLedger(ledgerPath, ledger) {
  ledger.updated_at = new Date().toISOString();
  ledger.unit_count = Array.isArray(ledger.units) ? ledger.units.length : 0;
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
}

function saveReadiness(readinessPath, readiness) {
  fs.writeFileSync(readinessPath, JSON.stringify(readiness, null, 2), 'utf8');
}

function saveRawInput(rawDir, text, meta = {}) {
  fs.mkdirSync(rawDir, { recursive: true });
  const filename = nextRawName(rawDir);
  const rawId = toRawId(filename);
  const frontmatter = [
    '---',
    `id: ${rawId}`,
    `created: ${new Date().toISOString()}`,
    ...(meta.project_exists !== undefined ? [`project_exists: ${meta.project_exists}`] : []),
    ...(meta.active_phase !== undefined && meta.active_phase !== null ? [`active_phase: ${meta.active_phase}`] : []),
    '---',
    '',
  ].join('\n');
  const rawPath = path.join(rawDir, filename);
  fs.writeFileSync(rawPath, `${frontmatter}${text}\n`, 'utf8');
  return { raw_id: rawId, raw_path: rawPath };
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeUnitForStorage(unit) {
  const normalized = {
    id: unit.id || null,
    type: unit.type,
    summary: String(unit.summary || '').trim(),
    actor: unit.actor ? String(unit.actor).trim() : null,
    need: unit.need ? String(unit.need).trim() : null,
    value: unit.value ? String(unit.value).trim() : null,
    constraint: unit.constraint ? String(unit.constraint).trim() : null,
    confidence: typeof unit.confidence === 'number' ? unit.confidence : 0.5,
    status: unit.status || null,
    phase_hint: unit.phase_hint && unit.phase_hint.phase != null
      ? {
          phase: String(unit.phase_hint.phase),
          confidence: typeof unit.phase_hint.confidence === 'number' ? unit.phase_hint.confidence : 0.5,
          reason: unit.phase_hint.reason ? String(unit.phase_hint.reason).trim() : '',
        }
      : null,
    evidence: Array.isArray(unit.evidence) ? [...new Set(unit.evidence.map(String))] : [],
    open_questions: Array.isArray(unit.open_questions) ? [...new Set(unit.open_questions.map(String))] : [],
    conflicts_with: Array.isArray(unit.conflicts_with) ? [...new Set(unit.conflicts_with.map(String))] : [],
  };

  normalized.confidence = Math.max(0, Math.min(1, normalized.confidence));
  return normalized;
}

function unitFingerprint(unit) {
  const type = normalizeText(unit.type);
  if (type === 'user_story') {
    return [
      type,
      normalizeText(unit.actor || ''),
      normalizeText(unit.need || unit.summary || ''),
    ].join('|');
  }
  return [type, normalizeText(unit.summary || '')].join('|');
}

function uniqueArray(values) {
  return [...new Set(values.filter(Boolean))];
}

function resolveUnitStatus(unit, preferredStatus = null) {
  if ((unit.conflicts_with || []).length > 0) return 'conflicted';
  if (preferredStatus) return preferredStatus;
  return evolveUnitStatus(unit);
}

function evolveUnitStatus(unit) {
  if ((unit.conflicts_with || []).length > 0) return 'conflicted';

  const evidenceCount = (unit.evidence || []).length;
  const hasStoryShape =
    unit.type !== 'user_story' ||
    (unit.actor && unit.need && (unit.value || unit.constraint || unit.summary));

  if (unit.type === 'user_story' && unit.confidence >= 0.85 && hasStoryShape) return 'mature';
  if (unit.type !== 'user_story' && evidenceCount >= 3 && unit.confidence >= 0.9) return 'mature';
  if (evidenceCount >= 2 || unit.confidence >= 0.75) return 'reinforced';
  return 'tentative';
}

function mergeUnitIntoLedger(ledger, unit, rawId) {
  const normalized = normalizeUnitForStorage(unit);
  const fingerprint = unitFingerprint(normalized);
  const existingIndex = ledger.units.findIndex(candidate => unitFingerprint(candidate) === fingerprint);

  if (existingIndex === -1) {
    const created = {
      ...normalized,
      id: normalized.id || `INT-${String(ledger.units.length + 1).padStart(3, '0')}`,
      evidence: uniqueArray([...(normalized.evidence || []), rawId]),
    };
    created.status = resolveUnitStatus(created, normalized.status);
    ledger.units.push(created);
    return { ledger, merged_unit: created, created: true };
  }

  const existing = ledger.units[existingIndex];
  const merged = {
    ...existing,
    summary: existing.summary || normalized.summary,
    actor: existing.actor || normalized.actor,
    need: existing.need || normalized.need,
    value: existing.value || normalized.value,
    constraint: existing.constraint || normalized.constraint,
    confidence: Math.max(existing.confidence || 0, normalized.confidence || 0),
    evidence: uniqueArray([...(existing.evidence || []), ...(normalized.evidence || []), rawId]),
    open_questions: uniqueArray([...(existing.open_questions || []), ...(normalized.open_questions || [])]),
    conflicts_with: uniqueArray([...(existing.conflicts_with || []), ...(normalized.conflicts_with || [])]),
  };

  if (!merged.phase_hint && normalized.phase_hint) {
    merged.phase_hint = normalized.phase_hint;
  } else if (merged.phase_hint && normalized.phase_hint) {
    const existingScore = Number(merged.phase_hint.confidence || 0);
    const incomingScore = Number(normalized.phase_hint.confidence || 0);
    if (incomingScore > existingScore) {
      merged.phase_hint = normalized.phase_hint;
    }
  }

  merged.status = resolveUnitStatus(merged, normalized.status);
  ledger.units[existingIndex] = merged;
  return { ledger, merged_unit: merged, created: false };
}

function mergeUnits(ledger, units, rawId) {
  const stats = {
    created: 0,
    updated: 0,
    by_type: {},
    conflicted: 0,
  };

  for (const unit of units) {
    const result = mergeUnitIntoLedger(ledger, unit, rawId);
    if (result.created) stats.created++;
    else stats.updated++;
    stats.by_type[result.merged_unit.type] = (stats.by_type[result.merged_unit.type] || 0) + 1;
  }

  stats.conflicted = ledger.units.filter(unit => unit.status === 'conflicted').length;

  const dominantPhaseHints = aggregatePhaseScores(ledger).filter(item => item.confidence > 0);
  return { ledger, stats, dominant_phase_hints: dominantPhaseHints };
}

function aggregatePhaseScores(ledger) {
  const typeWeights = {
    user_story: 1.0,
    constraint: 0.8,
    preference: 0.6,
    technical_enabler: 0.5,
    open_question: 0.2,
  };
  const statusWeights = {
    tentative: 0.5,
    reinforced: 0.8,
    mature: 1.0,
    conflicted: 0.2,
  };

  const phaseScores = new Map();
  for (const unit of ledger.units) {
    if (!unit.phase_hint || unit.phase_hint.phase == null) continue;
    const phase = String(unit.phase_hint.phase);
    const current = phaseScores.get(phase) || 0;
    const typeWeight = typeWeights[unit.type] || 0.2;
    const statusWeight = statusWeights[unit.status] || 0.5;
    const added = (unit.phase_hint.confidence || 0) * typeWeight * statusWeight;
    phaseScores.set(phase, current + added);
  }

  return [...phaseScores.entries()]
    .map(([phase, score]) => ({
      phase,
      score,
      confidence: Math.max(0, Math.min(1, score)),
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

function computeProjectReadiness(ledger) {
  const counts = {
    user_story_mature: 0,
    user_story_reinforced: 0,
    constraint: 0,
    preference: 0,
    technical_enabler: 0,
    open_question_critical: 0,
    conflicts_blocking: 0,
  };

  for (const unit of ledger.units) {
    if (unit.type === 'user_story' && unit.status === 'mature') counts.user_story_mature++;
    if (unit.type === 'user_story' && unit.status === 'reinforced') counts.user_story_reinforced++;
    if (unit.type === 'constraint') counts.constraint++;
    if (unit.type === 'preference') counts.preference++;
    if (unit.type === 'technical_enabler') counts.technical_enabler++;
    if (unit.type === 'open_question' && unit.confidence >= 0.7) counts.open_question_critical++;
    if (unit.status === 'conflicted') counts.conflicts_blocking++;
  }

  let score = 0;
  score += Math.min(1, counts.user_story_mature / 2) * 0.55;
  score += counts.user_story_reinforced > 0 ? 0.1 : 0;
  score += (counts.constraint + counts.preference) > 0 ? 0.2 : 0;
  score += counts.technical_enabler > 0 ? 0.05 : 0;
  score += counts.open_question_critical === 0 ? 0.05 : counts.open_question_critical <= 2 ? 0.02 : 0;
  score += counts.conflicts_blocking === 0 ? 0.05 : 0;

  return {
    score: Math.max(0, Math.min(1, score)),
    counts,
  };
}

function computePhaseReadiness(ledger, targetPhase) {
  const phaseUnits = ledger.units.filter(unit => unit.phase_hint && String(unit.phase_hint.phase) === String(targetPhase));
  const counts = {
    user_story_mature: 0,
    user_story_reinforced: 0,
    constraint: 0,
    preference: 0,
    technical_enabler: 0,
    open_question_critical: 0,
    conflicts_blocking: 0,
  };

  for (const unit of phaseUnits) {
    if (unit.type === 'user_story' && unit.status === 'mature') counts.user_story_mature++;
    if (unit.type === 'user_story' && unit.status === 'reinforced') counts.user_story_reinforced++;
    if (unit.type === 'constraint') counts.constraint++;
    if (unit.type === 'preference') counts.preference++;
    if (unit.type === 'technical_enabler') counts.technical_enabler++;
    if (unit.type === 'open_question' && unit.confidence >= 0.7) counts.open_question_critical++;
    if (unit.status === 'conflicted') counts.conflicts_blocking++;
  }

  let score = 0;
  score += counts.user_story_mature > 0 ? 0.5 : 0;
  score += counts.user_story_reinforced > 0 ? 0.1 : 0;
  score += (counts.constraint + counts.preference) > 0 ? 0.2 : 0;
  score += phaseUnits.length >= 2 ? 0.1 : 0;
  score += counts.conflicts_blocking === 0 ? 0.1 : 0;

  return {
    score: Math.max(0, Math.min(1, score)),
    counts,
  };
}

function hasBacklogSignal(ledger) {
  return ledger.units.some(unit => {
    const haystack = normalizeText([unit.summary, unit.need, unit.value, unit.constraint].filter(Boolean).join(' '));
    return /\b(later|future)\b/.test(haystack) || haystack.includes('后面') || haystack.includes('以后') || haystack.includes('之后');
  });
}

function countUnitsByType(units) {
  return units.reduce((acc, unit) => {
    acc[unit.type] = (acc[unit.type] || 0) + 1;
    return acc;
  }, {});
}

function phaseFilePrefix(phaseNumber) {
  const value = String(phaseNumber);
  return /^\d+$/.test(value) ? value.padStart(2, '0') : value;
}

function groupUnitsByType(units) {
  const groups = {
    user_story: [],
    constraint: [],
    preference: [],
    technical_enabler: [],
    open_question: [],
  };

  for (const unit of units) {
    if (!groups[unit.type]) groups[unit.type] = [];
    groups[unit.type].push(unit);
  }
  return groups;
}

function renderUnitLine(unit) {
  const details = [];
  if (unit.status) details.push(`status=${unit.status}`);
  if (typeof unit.confidence === 'number') details.push(`conf=${unit.confidence.toFixed(2)}`);
  if (unit.phase_hint && unit.phase_hint.phase != null) details.push(`phase=${unit.phase_hint.phase}`);
  return `- ${unit.summary}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
}

function renderSection(title, units) {
  const lines = [`## ${title}`, ''];
  if (!units || units.length === 0) {
    lines.push('- None', '');
    return lines.join('\n');
  }

  for (const unit of units) {
    lines.push(renderUnitLine(unit));
    if (unit.type === 'user_story') {
      if (unit.actor) lines.push(`  actor: ${unit.actor}`);
      if (unit.need) lines.push(`  need: ${unit.need}`);
      if (unit.value) lines.push(`  value: ${unit.value}`);
    } else if (unit.constraint) {
      lines.push(`  detail: ${unit.constraint}`);
    }
    if (unit.phase_hint && unit.phase_hint.reason) {
      lines.push(`  phase_reason: ${unit.phase_hint.reason}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderCardsMarkdown(ledger, readiness = null) {
  const groups = groupUnitsByType(ledger.units);
  const lines = [
    '# Intake Cards',
    '',
    `Updated: ${new Date().toISOString()}`,
    `Raw Inputs: ${ledger.raw_count || 0}`,
    `Units: ${ledger.unit_count || ledger.units.length || 0}`,
  ];

  if (readiness) {
    lines.push(
      `Status: ${readiness.one_line_status || ''}`,
      ''
    );
  } else {
    lines.push('');
  }

  lines.push(renderSection('User Stories', groups.user_story));
  lines.push(renderSection('Constraints', groups.constraint));
  lines.push(renderSection('Preferences', groups.preference));
  lines.push(renderSection('Technical Enablers', groups.technical_enabler));
  lines.push(renderSection('Open Questions', groups.open_question));

  return lines.join('\n').trim() + '\n';
}

function collectPhaseUnits(ledger, targetPhase) {
  return ledger.units.filter(unit => unit.phase_hint && String(unit.phase_hint.phase) === String(targetPhase));
}

function renderProjectBriefMarkdown(ledger, readiness) {
  const groups = groupUnitsByType(ledger.units);
  const lines = [
    '# Intake Brief',
    '',
    'Auto-generated semantic project brief from intake memory.',
    '',
    '## Readiness',
    '',
    `- Mode: ${readiness.mode}`,
    `- Next action: ${readiness.next_action}`,
    `- Project readiness: ${readiness.project_ready_score.toFixed(2)}`,
    `- Status line: ${readiness.one_line_status}`,
    '',
    renderSection('User Story Candidates', groups.user_story),
    renderSection('Constraints', groups.constraint),
    renderSection('Preferences', groups.preference),
    renderSection('Technical Enablers', groups.technical_enabler),
    renderSection('Open Questions', groups.open_question),
  ];

  return lines.join('\n').trim() + '\n';
}

function renderPhaseBriefMarkdown(snapshot, ledger, readiness) {
  const targetPhase = readiness.target_phase;
  const phaseInfo = snapshot.phases.find(phase => String(phase.number) === String(targetPhase));
  const phaseUnits = collectPhaseUnits(ledger, targetPhase);
  const groups = groupUnitsByType(phaseUnits);
  const lines = [
    `# Phase ${targetPhase} Intake Brief`,
    '',
    'Auto-generated semantic brief for the target phase.',
    '',
    '## Phase Context',
    '',
    `- Phase: ${targetPhase}${phaseInfo ? ` - ${phaseInfo.name}` : ''}`,
    `- Goal: ${phaseInfo && phaseInfo.goal ? phaseInfo.goal : 'Not available'}`,
    `- Next action: ${readiness.next_action}`,
    `- Target confidence: ${readiness.target_phase_confidence.toFixed(2)}`,
    `- Existing plans: ${readiness.has_existing_plans ? 'yes' : 'no'}`,
    '',
    renderSection('User Stories', groups.user_story),
    renderSection('Constraints', groups.constraint),
    renderSection('Preferences', groups.preference),
    renderSection('Technical Enablers', groups.technical_enabler),
    renderSection('Open Questions', groups.open_question),
  ];

  return lines.join('\n').trim() + '\n';
}

function writeCards(paths, ledger, readiness) {
  const markdown = renderCardsMarkdown(ledger, readiness);
  fs.writeFileSync(paths.cardsPath, markdown, 'utf8');
  return paths.cardsPath;
}

function writeProjectBrief(paths, ledger, readiness) {
  const markdown = renderProjectBriefMarkdown(ledger, readiness);
  fs.writeFileSync(paths.briefPath, markdown, 'utf8');
  return paths.briefPath;
}

function writePhaseBrief(snapshot, paths, ledger, readiness) {
  if (!readiness.target_phase) return null;
  const dirPath = snapshot.phase_dirs[String(readiness.target_phase)];
  if (!dirPath) return null;
  fs.mkdirSync(dirPath, { recursive: true });
  const briefPath = path.join(dirPath, `${phaseFilePrefix(readiness.target_phase)}-INTAKE.md`);
  const markdown = renderPhaseBriefMarkdown(snapshot, ledger, readiness);
  fs.writeFileSync(briefPath, markdown, 'utf8');
  return briefPath;
}

function buildOneLineStatus({
  mode,
  project_ready_score,
  target_phase,
  target_phase_confidence,
  next_action,
  has_existing_plans,
  blocking_conflicts,
}) {
  if (blocking_conflicts > 0) {
    return `已收纳 | conflict=${blocking_conflicts} 已标记 | next=${next_action}`;
  }
  if (next_action === 'backlog_candidate') return '已收纳 | backlog candidate | next=backlog_candidate';
  if (mode === 'cold_start') {
    if (next_action === 'trigger_new_project') return '已收纳 | brief ready | next=trigger_new_project';
    return `已收纳 | project-ready=${project_ready_score.toFixed(2)} | next=${next_action}`;
  }
  if (target_phase != null) {
    const plans = has_existing_plans ? ' existing-plans=yes' : '';
    return `已收纳 | phase=${target_phase} conf=${target_phase_confidence.toFixed(2)}${plans} | next=${next_action}`;
  }
  return `已收纳 | next=${next_action}`;
}

function decideIntakeNextAction(snapshot, ledger) {
  const project = computeProjectReadiness(ledger);
  const phaseScores = aggregatePhaseScores(ledger);
  const topPhase = phaseScores[0] || null;
  const targetPhase = topPhase ? String(topPhase.phase) : null;
  const targetPhaseConfidence = topPhase ? topPhase.confidence : 0;
  const phaseReadiness = targetPhase ? computePhaseReadiness(ledger, targetPhase) : { score: 0, counts: {} };
  const hasExistingPlans = targetPhase ? Boolean(snapshot.existing_plans_by_phase[targetPhase]) : false;
  const phaseStatus = targetPhase ? snapshot.phase_statuses[targetPhase] : null;
  const blockingConflicts = project.counts.conflicts_blocking;
  const backlogSignal = hasBacklogSignal(ledger);

  let nextAction = 'collect_more';
  const mode = (!snapshot.project_exists || !snapshot.roadmap_exists) ? 'cold_start' : 'initialized_project';

  if (mode === 'cold_start') {
    const scopeReady = (project.counts.constraint + project.counts.preference) >= 1;
    const enoughStories = project.counts.user_story_mature >= 2;
    const openQuestionsOkay = project.counts.open_question_critical <= 2;
    if (enoughStories && scopeReady && blockingConflicts === 0 && openQuestionsOkay && project.score >= 0.75) {
      nextAction = 'trigger_new_project';
    }
  } else if (targetPhase && phaseStatus !== 'complete' && targetPhaseConfidence >= 0.9 && phaseReadiness.score >= 0.8 && blockingConflicts === 0 && !hasExistingPlans) {
    nextAction = 'trigger_plan_phase_prd';
  } else if (targetPhase && (targetPhaseConfidence >= 0.75 || hasExistingPlans)) {
    nextAction = hasExistingPlans ? 'idle' : 'materialize_phase_brief';
  } else if (backlogSignal) {
    nextAction = 'backlog_candidate';
  } else if ((project.counts.constraint + project.counts.preference) > 0 && project.counts.user_story_mature === 0) {
    nextAction = 'idle';
  }

  const result = {
    mode,
    project_ready_score: project.score,
    phase_ready_score: phaseReadiness.score,
    target_phase: targetPhase,
    target_phase_confidence: targetPhaseConfidence,
    has_existing_plans: hasExistingPlans,
    blocking_conflicts: blockingConflicts,
    counts: project.counts,
    next_action: nextAction,
  };
  result.one_line_status = buildOneLineStatus({
    mode,
    project_ready_score: project.score,
    target_phase: targetPhase,
    target_phase_confidence: targetPhaseConfidence,
    next_action: nextAction,
    has_existing_plans: hasExistingPlans,
    blocking_conflicts: blockingConflicts,
  });
  return result;
}

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] || '') : '';
}

function resolveJsonPath(cwd, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
}

function parseUnitsFile(cwd, unitsFile) {
  const resolved = resolveJsonPath(cwd, unitsFile);
  const parsed = safeReadJson(resolved, null);
  if (!parsed) error(`Failed to read units file: ${resolved}`);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.units)) return parsed.units;
  error('Units file must contain an array or { "units": [...] }');
}

function parseResolutionFile(cwd, resolutionFile) {
  const resolved = resolveJsonPath(cwd, resolutionFile);
  const parsed = safeReadJson(resolved, null);
  if (!parsed || typeof parsed !== 'object') {
    error(`Failed to read resolution file: ${resolved}`);
  }
  if (!Array.isArray(parsed.canonical_units)) {
    error('Resolution file must contain { "canonical_units": [...] }');
  }
  return parsed;
}

function parseAssessmentFile(cwd, assessmentFile) {
  const resolved = resolveJsonPath(cwd, assessmentFile);
  const parsed = safeReadJson(resolved, null);
  if (!parsed || typeof parsed !== 'object') {
    error(`Failed to read assessment file: ${resolved}`);
  }
  return parsed;
}

function parseArtifactsFile(cwd, artifactsFile) {
  const resolved = resolveJsonPath(cwd, artifactsFile);
  const parsed = safeReadJson(resolved, null);
  if (!parsed || typeof parsed !== 'object') {
    error(`Failed to read artifacts file: ${resolved}`);
  }
  return parsed;
}

function applyResolution(ledger, resolution, rawId) {
  const stats = {
    created: 0,
    updated: 0,
    duplicates_applied: 0,
    conflicts_applied: 0,
  };

  const canonicalUnits = resolution.canonical_units || [];
  for (const candidate of canonicalUnits) {
    if (candidate.id) {
      const existingIndex = ledger.units.findIndex(unit => unit.id === candidate.id);
      if (existingIndex !== -1) {
        const normalized = normalizeUnitForStorage(candidate);
        const existing = ledger.units[existingIndex];
        const merged = {
          ...existing,
          ...normalized,
          id: existing.id,
          evidence: uniqueArray([...(existing.evidence || []), ...(normalized.evidence || []), rawId]),
          open_questions: uniqueArray([...(existing.open_questions || []), ...(normalized.open_questions || [])]),
          conflicts_with: uniqueArray([...(existing.conflicts_with || []), ...(normalized.conflicts_with || [])]),
        };
        merged.status = resolveUnitStatus(merged, normalized.status || existing.status);
        ledger.units[existingIndex] = merged;
        stats.updated++;
        continue;
      }
    }

    const result = mergeUnitIntoLedger(ledger, candidate, rawId);
    if (result.created) stats.created++;
    else stats.updated++;
  }

  for (const duplicate of resolution.duplicates || []) {
    const targetId = duplicate.matches_unit_id || duplicate.target_id || duplicate.unit_id;
    if (!targetId) continue;
    const unit = ledger.units.find(entry => entry.id === targetId);
    if (!unit) continue;
    unit.evidence = uniqueArray([...(unit.evidence || []), rawId]);
    unit.status = resolveUnitStatus(unit, unit.status);
    stats.duplicates_applied++;
  }

  for (const conflict of resolution.conflicts || []) {
    const ids = uniqueArray([
      conflict.unit_id,
      conflict.unit_a,
      conflict.unit_b,
      ...(Array.isArray(conflict.conflicts_with) ? conflict.conflicts_with : []),
    ].map(value => value != null ? String(value) : null));
    if (ids.length < 2) continue;

    for (const id of ids) {
      const unit = ledger.units.find(entry => entry.id === id);
      if (!unit) continue;
      unit.conflicts_with = uniqueArray([...(unit.conflicts_with || []), ...ids.filter(other => other !== id)]);
      unit.status = 'conflicted';
      stats.conflicts_applied++;
    }
  }

  ledger.unit_count = ledger.units.length;
  return { ledger, stats };
}

function guardAssessment(snapshot, ledger, assessment) {
  const project = computeProjectReadiness(ledger);
  const mode = assessment.mode || ((!snapshot.project_exists || !snapshot.roadmap_exists) ? 'cold_start' : 'initialized_project');
  const targetPhase = assessment.target_phase != null ? String(assessment.target_phase) : null;
  const targetPhaseConfidence = typeof assessment.target_phase_confidence === 'number' ? assessment.target_phase_confidence : 0;
  const hasExistingPlans = targetPhase ? Boolean(snapshot.existing_plans_by_phase[targetPhase]) : false;
  const phaseStatus = targetPhase ? snapshot.phase_statuses[targetPhase] : null;
  const blockingConflicts = project.counts.conflicts_blocking;

  let nextAction = assessment.recommended_action || assessment.next_action || 'collect_more';

  if (blockingConflicts > 0) {
    nextAction = 'idle';
  } else if (mode === 'cold_start') {
    if (nextAction === 'trigger_plan_phase_prd' || nextAction === 'materialize_phase_brief') {
      nextAction = 'collect_more';
    }
  } else {
    if (nextAction === 'trigger_new_project') {
      nextAction = 'idle';
    }
    if ((nextAction === 'trigger_plan_phase_prd' || nextAction === 'materialize_phase_brief') && (!targetPhase || phaseStatus === 'complete')) {
      nextAction = 'idle';
    }
    if (nextAction === 'trigger_plan_phase_prd' && hasExistingPlans) {
      nextAction = 'idle';
    }
  }

  const projectReadyScore = typeof assessment.project_ready_score === 'number'
    ? assessment.project_ready_score
    : project.score;
  const phaseReadyScore = typeof assessment.phase_ready_score === 'number'
    ? assessment.phase_ready_score
    : (targetPhase ? computePhaseReadiness(ledger, targetPhase).score : 0);

  const result = {
    mode,
    project_ready_score: projectReadyScore,
    phase_ready_score: phaseReadyScore,
    target_phase: targetPhase,
    target_phase_confidence: targetPhaseConfidence,
    has_existing_plans: hasExistingPlans,
    blocking_conflicts: blockingConflicts,
    counts: project.counts,
    next_action: nextAction,
    why: Array.isArray(assessment.why) ? assessment.why : [],
    decision_source: 'assessment+guard',
  };

  result.one_line_status = buildOneLineStatus({
    mode,
    project_ready_score: projectReadyScore,
    target_phase: targetPhase,
    target_phase_confidence: targetPhaseConfidence,
    next_action: nextAction,
    has_existing_plans: hasExistingPlans,
    blocking_conflicts: blockingConflicts,
  });
  return result;
}

function loadReadiness(readinessPath) {
  const readiness = safeReadJson(readinessPath, null);
  return readiness && typeof readiness === 'object' ? readiness : null;
}

function cmdIntakeState(cwd, raw) {
  const paths = ensureIntakeRoot(cwd);
  const snapshot = loadPlanningSnapshot(cwd);
  output({
    ...snapshot,
    intake_root: paths.intakeRoot,
    planning_root: paths.planningRoot,
    ledger_path: paths.ledgerPath,
    cards_path: paths.cardsPath,
    brief_path: paths.briefPath,
    readiness_path: paths.readinessPath,
  }, raw);
}

function cmdIntakeSaveRaw(cwd, args, raw) {
  const text = getFlag(args, '--text');
  if (!text) error('--text is required');

  const paths = ensureIntakeRoot(cwd);
  const snapshot = loadPlanningSnapshot(cwd);
  const result = withIntakeLock(cwd, () => saveRawInput(paths.rawDir, text, {
    project_exists: snapshot.project_exists,
    active_phase: snapshot.active_phase,
  }));
  output(result, raw);
}

function cmdIntakeMerge(cwd, args, raw) {
  const rawId = getFlag(args, '--raw-id');
  const unitsFile = getFlag(args, '--units-file');
  const resolutionFile = getFlag(args, '--resolution-file');
  if (!rawId) error('--raw-id is required');
  if (!unitsFile && !resolutionFile) error('--units-file or --resolution-file is required');

  const paths = ensureIntakeRoot(cwd);

  const result = withIntakeLock(cwd, () => {
    const ledger = loadLedger(paths.ledgerPath);
    let merged;
    if (resolutionFile) {
      const resolution = parseResolutionFile(cwd, resolutionFile);
      merged = applyResolution(ledger, resolution, rawId);
    } else {
      const units = parseUnitsFile(cwd, unitsFile);
      merged = mergeUnits(ledger, units, rawId);
    }
    merged.ledger.raw_count = countRawFiles(paths.rawDir);
    saveLedger(paths.ledgerPath, merged.ledger);
    return merged;
  });

  output(result, raw);
}

function cmdIntakeDecide(cwd, args, raw) {
  const assessmentFile = getFlag(args, '--assessment-file');
  const paths = ensureIntakeRoot(cwd);
  const snapshot = loadPlanningSnapshot(cwd);
  const ledger = loadLedger(paths.ledgerPath);
  ledger.raw_count = countRawFiles(paths.rawDir);
  const result = assessmentFile
    ? guardAssessment(snapshot, ledger, parseAssessmentFile(cwd, assessmentFile))
    : decideIntakeNextAction(snapshot, ledger);
  saveReadiness(paths.readinessPath, result);
  output(result, raw);
}

function cmdIntakeRender(cwd, raw) {
  const paths = ensureIntakeRoot(cwd);
  const snapshot = loadPlanningSnapshot(cwd);
  const ledger = loadLedger(paths.ledgerPath);
  ledger.raw_count = countRawFiles(paths.rawDir);
  const readiness = decideIntakeNextAction(snapshot, ledger);
  saveReadiness(paths.readinessPath, readiness);
  const cardsPath = writeCards(paths, ledger, readiness);
  output({
    rendered: true,
    cards_path: cardsPath,
    counts: countUnitsByType(ledger.units),
  }, raw);
}

function cmdIntakeMaterialize(cwd, args, raw) {
  const artifactsFile = getFlag(args, '--artifacts-file');
  const paths = ensureIntakeRoot(cwd);
  const snapshot = loadPlanningSnapshot(cwd);
  const ledger = loadLedger(paths.ledgerPath);
  ledger.raw_count = countRawFiles(paths.rawDir);
  const readiness = loadReadiness(paths.readinessPath) || decideIntakeNextAction(snapshot, ledger);
  saveReadiness(paths.readinessPath, readiness);

  const artifacts = artifactsFile ? parseArtifactsFile(cwd, artifactsFile) : null;
  let cardsPath;
  let projectBriefPath;
  let phaseBriefPath;

  if (artifacts && typeof artifacts.cards_markdown === 'string') {
    fs.writeFileSync(paths.cardsPath, artifacts.cards_markdown, 'utf8');
    cardsPath = paths.cardsPath;
  } else {
    cardsPath = writeCards(paths, ledger, readiness);
  }

  if (artifacts && typeof artifacts.project_brief_markdown === 'string') {
    fs.writeFileSync(paths.briefPath, artifacts.project_brief_markdown, 'utf8');
    projectBriefPath = paths.briefPath;
  } else {
    projectBriefPath = writeProjectBrief(paths, ledger, readiness);
  }

  if (artifacts && typeof artifacts.phase_brief_markdown === 'string' && readiness.target_phase) {
    const dirPath = snapshot.phase_dirs[String(readiness.target_phase)];
    if (dirPath) {
      fs.mkdirSync(dirPath, { recursive: true });
      phaseBriefPath = path.join(dirPath, `${phaseFilePrefix(readiness.target_phase)}-INTAKE.md`);
      fs.writeFileSync(phaseBriefPath, artifacts.phase_brief_markdown, 'utf8');
    } else {
      phaseBriefPath = null;
    }
  } else {
    phaseBriefPath = writePhaseBrief(snapshot, paths, ledger, readiness);
  }
  const projectBriefRel = projectBriefPath ? toPosixPath(path.relative(cwd, projectBriefPath)) : null;
  const phaseBriefRel = phaseBriefPath ? toPosixPath(path.relative(cwd, phaseBriefPath)) : null;

  let dispatchCommand = null;
  if (readiness.next_action === 'trigger_new_project' && projectBriefRel) {
    dispatchCommand = `/gsdt:new-project --auto @${projectBriefRel}`;
  } else if (readiness.next_action === 'trigger_plan_phase_prd' && phaseBriefRel && readiness.target_phase != null) {
    dispatchCommand = `/gsdt:plan-phase ${readiness.target_phase} --prd ${phaseBriefRel}`;
  }

  output({
    next_action: readiness.next_action,
    target_phase: readiness.target_phase,
    has_existing_plans: readiness.has_existing_plans,
    cards_written: true,
    cards_path: cardsPath,
    project_brief_written: Boolean(projectBriefPath),
    project_brief_path: projectBriefPath,
    phase_brief_written: Boolean(phaseBriefPath),
    phase_brief_path: phaseBriefPath,
    dispatch_command: dispatchCommand,
  }, raw);
}

module.exports = {
  intakePaths,
  ensureIntakeRoot,
  loadPlanningSnapshot,
  loadLedger,
  saveLedger,
  saveRawInput,
  mergeUnits,
  computeProjectReadiness,
  computePhaseReadiness,
  decideIntakeNextAction,
  renderCardsMarkdown,
  renderProjectBriefMarkdown,
  renderPhaseBriefMarkdown,
  cmdIntakeState,
  cmdIntakeSaveRaw,
  cmdIntakeMerge,
  cmdIntakeDecide,
  cmdIntakeRender,
  cmdIntakeMaterialize,
};
