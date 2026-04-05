/**
 * Compound contract helpers
 */
const fs = require('fs');
const path = require('path');
const { planningRoot } = require('../core.cjs');

const BUG_TRACK_TYPES = new Set([
  'logic_error',
  'build_error',
  'test_failure',
  'runtime_error',
  'performance_issue',
  'database_issue',
  'security_issue',
  'ui_bug',
  'integration_issue',
]);

const KNOWLEDGE_TRACK_TYPES = new Set([
  'best_practice',
  'workflow_issue',
  'documentation_gap',
  'developer_experience',
]);

const CATEGORY_KEYS = {
  logic_error: 'logic-errors',
  build_error: 'build-errors',
  test_failure: 'test-failures',
  runtime_error: 'runtime-errors',
  performance_issue: 'performance-issues',
  database_issue: 'database-issues',
  security_issue: 'security-issues',
  ui_bug: 'ui-bugs',
  integration_issue: 'integration-issues',
  best_practice: 'best-practices',
  workflow_issue: 'workflow-issues',
  documentation_gap: 'documentation-gaps',
  developer_experience: 'developer-experience',
};

const EVENT_SOURCES = new Set([
  'verify-work',
  'diagnose-issues',
  'debug',
  'execute-phase',
  'assess',
  'post-commit',
]);

const EVENT_STATUSES = new Set(['candidate', 'diagnosed', 'resolved']);

const EVENT_STATUS_ORDER = {
  candidate: 0,
  diagnosed: 1,
  resolved: 2,
};

/** Relative path for display; actual file is under `planningRoot(baseDir)`. */
const COMPOUND_EVENT_FILE = path.join('.gsdt-planning', 'compound-events.json');

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'string') {
    return value.split(/[\n,]/).map(v => v.trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(value, maxLength = 80) {
  const slug = normalizeText(value).replace(/\s+/g, '-').replace(/^-|-$/g, '');
  return slug.substring(0, maxLength) || 'unknown';
}

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const POST_COMMIT_FIX_SIGNAL = /\b(fix(?:es|ed)?|bug(?:fix)?|hotfix|error|issue|problem|regression|patch(?:es|ed)?)\b/i;
const POST_COMMIT_ROOT_CAUSE_HINT = /\b(missing|invalid|stale|race|null|undefined|dependency|dependencies|guard|cache|state|async|await|timeout|retry|import|path|config|schema|query|index|permission|auth|token|closure|effect)\b/i;
const POST_COMMIT_CAUSAL_SPLIT = /^(.*?)(?:\s+)(?:due to|because(?: of)?|caused by|triggered by|from)\s+(.+)$/i;

function firstLine(value) {
  return String(value || '').split(/\r?\n/)[0].trim();
}

function trimSentence(value) {
  return String(value || '').trim().replace(/[.]+$/, '').trim();
}

function stripCommitPrefix(value) {
  let subject = firstLine(value);
  subject = subject.replace(/^[a-z]+(?:\([^)]+\))?!?:\s*/i, '');
  subject = subject.replace(/^(?:fix(?:es|ed)?|bug(?:fix)?|resolve(?:s|d)?|patch(?:es|ed)?|hotfix|address(?:es|ed)?)\b[:\s-]*/i, '');
  return trimSentence(subject);
}

function buildPostCommitCompoundEvent(input = {}) {
  const eventName = String(input.event || 'post-commit').trim().toLowerCase();
  if (eventName !== 'post-commit') return null;

  const commitMessage = String(input.commit_message || input.commitMessage || '').trim();
  const commitHash = String(input.commit_hash || input.commitHash || '').trim();
  const subject = firstLine(commitMessage);
  if (!subject || !POST_COMMIT_FIX_SIGNAL.test(subject)) return null;

  const strippedSubject = stripCommitPrefix(subject) || trimSentence(subject);
  let problem = strippedSubject || 'Post-commit fix captured';
  let rootCause = '';

  const causalMatch = strippedSubject.match(POST_COMMIT_CAUSAL_SPLIT);
  if (causalMatch) {
    problem = trimSentence(causalMatch[1]) || problem;
    rootCause = trimSentence(causalMatch[2]);
  } else if (POST_COMMIT_ROOT_CAUSE_HINT.test(strippedSubject)) {
    rootCause = strippedSubject;
  }

  const shortHash = commitHash ? commitHash.slice(0, 12) : '';
  return {
    source: 'post-commit',
    status: rootCause ? 'diagnosed' : 'candidate',
    problem,
    symptoms: shortHash
      ? [`Auto-captured from commit ${shortHash} via post-commit hook`]
      : ['Auto-captured via post-commit hook'],
    root_cause: rootCause,
    severity: input.severity || 'P2',
    files: toArray(input.files),
    phase: String(input.phase || '').trim(),
    suggested_fix: '',
    tags: [
      'post-commit',
      'git-hook',
      rootCause ? 'heuristic-diagnosed' : 'heuristic-candidate',
    ],
    commit_hash: commitHash,
    commit_message: commitMessage,
  };
}

function mapSeverity(value) {
  const severity = String(value || '').trim().toLowerCase();
  const mapping = {
    p0: 'P0',
    critical: 'P0',
    blocker: 'P0',
    block: 'P0',
    p1: 'P1',
    high: 'P1',
    major: 'P1',
    p2: 'P2',
    medium: 'P2',
    moderate: 'P2',
    minor: 'P2',
    p3: 'P3',
    low: 'P3',
    cosmetic: 'P3',
  };
  return mapping[severity] || 'P2';
}

function severityRank(value) {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[mapSeverity(value)] ?? 2;
}

function compareStatuses(a, b) {
  return (EVENT_STATUS_ORDER[a] ?? 0) - (EVENT_STATUS_ORDER[b] ?? 0);
}

function inferProblemType(text, files = []) {
  const haystack = `${text || ''} ${files.join(' ')}`.toLowerCase();
  if (/n\+1|slow|latency|timeout|perf|performance|query/.test(haystack)) return 'performance_issue';
  if (/build|compile|typescript|typecheck|type error|syntax|import cycle/.test(haystack)) return 'build_error';
  if (/test|assert|spec|snapshot|flaky/.test(haystack)) return 'test_failure';
  if (/sql|database|migration|index|query|prisma|schema/.test(haystack)) return 'database_issue';
  if (/auth|permission|security|csrf|xss|injection|token/.test(haystack)) return 'security_issue';
  if (/ui|button|modal|drawer|layout|spacing|color|refresh|render/.test(haystack)) return 'ui_bug';
  if (/api|webhook|integration|third-party|stripe|github|sync/.test(haystack)) return 'integration_issue';
  if (/crash|exception|panic|throw|undefined|null/.test(haystack)) return 'runtime_error';
  return 'logic_error';
}

function buildDedupeKey(input = {}) {
  const problemType = input.problem_type || inferProblemType(`${input.problem || ''} ${input.root_cause || ''}`, toArray(input.files));
  const problem = slugify(input.problem || input.truth || 'unknown-problem', 48);
  const rootCause = input.root_cause ? slugify(input.root_cause, 48) : 'candidate';
  return `${slugify(problemType, 32)}--${problem}--${rootCause}`;
}

function normalizeCompoundEvent(input = {}) {
  const source = EVENT_SOURCES.has(input.source) ? input.source : 'debug';
  const problem = String(input.problem || input.truth || input.title || '').trim();
  const reasonSymptoms = input.reason ? [String(input.reason).trim()] : [];
  const symptoms = Array.from(new Set([...toArray(input.symptoms), ...reasonSymptoms]));
  const files = toArray(input.files);
  const rootCause = String(input.root_cause || input.known_root_cause || '').trim();
  const status = EVENT_STATUSES.has(input.status)
    ? input.status
    : rootCause ? 'diagnosed' : 'candidate';
  const tags = Array.from(new Set([
    ...toArray(input.tags).map(normalizeTag).filter(Boolean),
    normalizeTag(source),
  ])).filter(Boolean);
  const problemType = input.problem_type || inferProblemType(
    [problem, rootCause, symptoms.join(' '), input.suggested_fix || '', input.reason || ''].join(' '),
    files
  );
  const dedupeKey = input.dedupe_key || buildDedupeKey({
    problem,
    root_cause: rootCause,
    problem_type: problemType,
    files,
  });

  return {
    id: input.id || `compound-event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    source,
    sources: Array.from(new Set([...toArray(input.sources), source])),
    status,
    compound_state: input.compound_state || (status === 'candidate' ? 'candidate' : 'pending'),
    problem,
    problem_key: slugify(problem || 'unknown-problem', 96),
    symptoms,
    root_cause: rootCause,
    severity: mapSeverity(input.severity),
    problem_type: problemType,
    files,
    phase: String(input.phase || '').trim(),
    debug_session: String(input.debug_session || '').trim(),
    commit_hash: String(input.commit_hash || input.commitHash || '').trim(),
    commit_message: String(input.commit_message || input.commitMessage || '').trim(),
    suggested_fix: String(input.suggested_fix || '').trim(),
    missing: toArray(input.missing),
    tags,
    dedupe_key: dedupeKey,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    solution_doc: input.solution_doc || '',
    memory_id: input.memory_id || '',
    last_result: input.last_result || '',
  };
}

function getCompoundEventFile(baseDir) {
  return path.join(planningRoot(baseDir), 'compound-events.json');
}

function loadCompoundEvents(baseDir) {
  const filePath = getCompoundEventFile(baseDir);
  if (!fs.existsSync(filePath)) return { events: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (parsed && Array.isArray(parsed.events)) return parsed;
  } catch {}
  return { events: [] };
}

function saveCompoundEvents(baseDir, payload) {
  const filePath = getCompoundEventFile(baseDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  BUG_TRACK_TYPES,
  KNOWLEDGE_TRACK_TYPES,
  CATEGORY_KEYS,
  EVENT_SOURCES,
  EVENT_STATUSES,
  EVENT_STATUS_ORDER,
  COMPOUND_EVENT_FILE,
  toArray,
  normalizeText,
  slugify,
  normalizeTag,
  firstLine,
  trimSentence,
  stripCommitPrefix,
  mapSeverity,
  severityRank,
  compareStatuses,
  inferProblemType,
  buildDedupeKey,
  buildPostCommitCompoundEvent,
  normalizeCompoundEvent,
  getCompoundEventFile,
  loadCompoundEvents,
  saveCompoundEvents,
};
