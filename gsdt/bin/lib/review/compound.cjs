/**
 * Compound Learning Bridge
 * Event -> research -> solution doc / memory / anti-pattern
 */

const fs = require('fs');
const path = require('path');

const { extractFrontmatter, reconstructFrontmatter } = require('../frontmatter.cjs');
const {
  BUG_TRACK_TYPES,
  CATEGORY_KEYS,
  normalizeText,
  slugify,
  mapSeverity,
  severityRank,
  compareStatuses,
  inferProblemType,
  buildDedupeKey,
  firstLine,
  buildPostCommitCompoundEvent,
  normalizeCompoundEvent,
  loadCompoundEvents,
  saveCompoundEvents,
} = require('./compound-contract.cjs');

function severityToLabel(severity) {
  return { P0: 'critical', P1: 'high', P2: 'medium', P3: 'low' }[mapSeverity(severity)] || 'medium';
}

function stripEmptyFields(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
}

function researchToDoc(research) {
  const problemType = research.problem_type || inferProblemType(
    `${research.problem || ''} ${research.root_cause || ''}`,
    research.files || []
  );
  const severity = mapSeverity(research.severity || 'P2');
  const isBugTrack = BUG_TRACK_TYPES.has(problemType);
  const categoryKey = CATEGORY_KEYS[problemType] || 'logic-errors';

  const frontmatter = stripEmptyFields({
    title: research.title || research.problem?.substring(0, 80) || 'Untitled',
    date: research.date || new Date().toISOString().split('T')[0],
    problem_type: problemType,
    severity: severityToLabel(severity),
    tags: research.tags || [],
    track: isBugTrack ? 'bug' : 'knowledge',
    source: research.source || '',
    phase: research.phase || '',
    files: research.files || [],
    dedupe_key: research.dedupe_key || buildDedupeKey(research),
    related: research.related || [],
  });

  if (isBugTrack) {
    frontmatter.symptoms = research.symptoms || (research.problem ? [research.problem] : []);
    frontmatter.root_cause = research.root_cause || 'unknown';
    frontmatter.resolution_type = research.resolution_type || 'code_fix';
  }

  const body = generateBody(research, isBugTrack);
  return { frontmatter, body, categoryKey };
}

function renderList(items, fallback) {
  return (items && items.length ? items : [fallback]).map(item => `- ${item}`).join('\n');
}

function generateBody(research, isBugTrack) {
  const contextLines = [];
  if (research.source) contextLines.push(`- Source: ${research.source}`);
  if (research.phase) contextLines.push(`- Phase: ${research.phase}`);
  if (research.debug_session) contextLines.push(`- Debug Session: ${research.debug_session}`);
  if (research.commit_hash) contextLines.push(`- Commit: ${research.commit_hash}`);
  if (research.commit_message) contextLines.push(`- Commit Message: ${firstLine(research.commit_message)}`);
  if (research.files?.length) contextLines.push(...research.files.map(file => `- File: ${file}`));

  if (isBugTrack) {
    return [
      '## Context',
      '',
      contextLines.length ? contextLines.join('\n') : '- Background capture from automated compound pipeline',
      '',
      '## Problem',
      '',
      research.problem || 'No description provided.',
      '',
      '## Symptoms',
      '',
      renderList(research.symptoms, 'Symptom details pending'),
      '',
      '## Root Cause',
      '',
      research.root_cause || 'Root cause analysis pending.',
      '',
      '## Solution',
      '',
      research.solution || 'Solution details pending.',
      '',
      research.why_this_works ? ['## Why This Works', '', research.why_this_works, ''].join('\n') : '',
      '## Prevention',
      '',
      research.prevention || '- Add a regression test\n- Verify the surrounding workflow before shipping',
      '',
      research.examples ? ['## Examples', '', research.examples, ''].join('\n') : '',
    ].filter(Boolean).join('\n');
  }

  return [
    '## Context',
    '',
    research.problem || 'No context provided.',
    '',
    '## Guidance',
    '',
    research.solution || 'Guidance details pending.',
    '',
    '## Why This Matters',
    '',
    research.why_matters || 'Following this guidance improves future execution quality.',
    '',
    '## When to Apply',
    '',
    research.when_to_apply || '- When working in this area\n- When encountering similar symptoms',
    '',
    research.examples ? ['## Examples', '', research.examples, ''].join('\n') : '',
  ].filter(Boolean).join('\n');
}

function generateFilename(frontmatter) {
  return `${slugify(frontmatter.title, 64)}-${frontmatter.date}.md`;
}

function parseFrontmatter(content) {
  return extractFrontmatter(content);
}

function buildSearchTokens(query) {
  if (typeof query === 'object' && query) {
    return [
      query.problem,
      query.root_cause,
      query.problem_type,
      ...(query.tags || []),
      ...(query.files || []),
    ].join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  return String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function countMatches(haystack, tokens) {
  const normalized = normalizeText(haystack);
  return tokens.filter(token => normalized.includes(normalizeText(token))).length;
}

function sharedItems(a, b) {
  const left = new Set((Array.isArray(a) ? a : []).map(item => normalizeText(item)));
  return (Array.isArray(b) ? b : []).filter(item => left.has(normalizeText(item))).length;
}

function scoreDocumentMatch(research, frontmatter, content) {
  const tokens = buildSearchTokens(research);
  if (tokens.length === 0) return 0;

  let score = 0;
  const normalizedRootCause = normalizeText(research.root_cause);
  const normalizedFrontmatterRootCause = normalizeText(frontmatter.root_cause);
  const expectedSeverity = severityToLabel(research.severity);

  if (frontmatter.problem_type === research.problem_type) score += 2;
  if (frontmatter.severity === expectedSeverity) score += 1;
  if (normalizedRootCause && normalizedFrontmatterRootCause === normalizedRootCause) score += 5;
  if (frontmatter.dedupe_key && research.dedupe_key && frontmatter.dedupe_key === research.dedupe_key) score += 6;
  score += countMatches(frontmatter.title, tokens) * 2;
  score += countMatches(frontmatter.problem_type, tokens);
  score += countMatches(frontmatter.root_cause, tokens) * 2;
  score += sharedItems(frontmatter.tags, research.tags) * 2;
  score += sharedItems(frontmatter.files, research.files) * 2;
  score += Math.min(countMatches(content, tokens), tokens.length) * 0.25;

  return score;
}

function checkOverlap(baseDir, research, categoryKey) {
  const categoryDir = path.join(baseDir, 'docs', 'solutions', categoryKey);
  if (!fs.existsSync(categoryDir)) return null;

  const files = fs.readdirSync(categoryDir).filter(file => file.endsWith('.md'));
  let best = null;

  for (const file of files) {
    const filePath = path.join(categoryDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    const score = scoreDocumentMatch(research, frontmatter, content);

    if (!best || score > best.score) {
      best = { path: filePath, score, frontmatter };
    }
  }

  if (!best || best.score < 5) return null;
  return {
    ...best,
    similarity: Math.min(best.score / 12, 1),
    level: best.score >= 8 ? 'high' : 'moderate',
  };
}

function writeDoc(baseDir, frontmatter, body, categoryKey, existingPath = null) {
  const dir = path.join(baseDir, 'docs', 'solutions', categoryKey);
  fs.mkdirSync(dir, { recursive: true });

  const filename = existingPath ? path.basename(existingPath) : generateFilename(frontmatter);
  const filePath = existingPath || path.join(dir, filename);
  const frontmatterBlock = reconstructFrontmatter(stripEmptyFields(frontmatter));
  const markdown = `---\n${frontmatterBlock}\n---\n\n${body.trim()}\n`;
  fs.writeFileSync(filePath, markdown, 'utf8');
  return filePath;
}

async function processLearnings(baseDir, researchOutputs, options = {}) {
  const { minSeverity = 'P2', minConfidence = 0.5 } = options;
  const severityLimit = severityRank(minSeverity);
  const eligible = researchOutputs.filter(research => {
    const confidence = Number(research.confidence ?? 0.6);
    return severityRank(research.severity || 'P3') <= severityLimit && confidence >= minConfidence;
  });

  const results = [];
  const stats = {
    total: researchOutputs.length,
    eligible: eligible.length,
    created: 0,
    updated: 0,
  };

  for (const research of eligible) {
    const overlap = checkOverlap(baseDir, {
      ...research,
      severity: mapSeverity(research.severity || 'P2'),
      dedupe_key: research.dedupe_key || buildDedupeKey(research),
    }, CATEGORY_KEYS[research.problem_type] || 'logic-errors');

    const canonicalResearch = overlap && overlap.level === 'high'
      ? {
          ...research,
          title: overlap.frontmatter.title || research.title,
          date: overlap.frontmatter.date || research.date,
        }
      : research;
    const related = overlap && overlap.level === 'moderate'
      ? [path.relative(baseDir, overlap.path)]
      : [];
    const { frontmatter, body, categoryKey } = researchToDoc({
      ...canonicalResearch,
      related,
    });

    const filePath = writeDoc(
      baseDir,
      frontmatter,
      body,
      categoryKey,
      overlap && overlap.level === 'high' ? overlap.path : null
    );

    if (overlap && overlap.level === 'high') {
      results.push({ type: 'updated', path: filePath, overlap });
      stats.updated++;
    } else {
      results.push({ type: 'created', path: filePath, overlap: overlap || null });
      stats.created++;
    }
  }

  return { docs: results, stats };
}

async function findSolutions(baseDir, query, options = {}) {
  const docsDir = path.join(baseDir, 'docs', 'solutions');
  if (!fs.existsSync(docsDir)) {
    return { found: false, message: 'No solutions directory found' };
  }

  const queryObject = typeof query === 'object' && query ? query : { problem: query };
  const category = options.category || CATEGORY_KEYS[queryObject.problem_type];
  const categories = category
    ? [category]
    : fs.readdirSync(docsDir).filter(entry => fs.statSync(path.join(docsDir, entry)).isDirectory());

  const results = [];
  for (const cat of categories) {
    const catDir = path.join(docsDir, cat);
    if (!fs.existsSync(catDir)) continue;

    for (const file of fs.readdirSync(catDir).filter(name => name.endsWith('.md'))) {
      const filePath = path.join(catDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatter = parseFrontmatter(content);
      const matchScore = scoreDocumentMatch(queryObject, frontmatter, content);
      if (matchScore <= 0) continue;

      results.push({
        path: filePath,
        category: cat,
        title: frontmatter.title || file,
        problem_type: frontmatter.problem_type,
        severity: frontmatter.severity,
        date: frontmatter.date,
        match_score: matchScore,
      });
    }
  }

  results.sort((left, right) => right.match_score - left.match_score);

  if (results.length === 0) {
    return { found: false, message: 'No matching solutions found', query };
  }

  const best = results[0];
  const bestContent = fs.readFileSync(best.path, 'utf8');

  return {
    found: true,
    query,
    result: {
      path: best.path,
      category: best.category,
      title: best.title,
      problem_type: best.problem_type,
      severity: best.severity,
      date: best.date,
      preview: bestContent.substring(0, 1500),
    },
    matches: results.slice(0, 5),
    total_found: results.length,
  };
}

async function writeToMemory(baseDir, research, solutionDocPath) {
  const memoryPath = path.join(baseDir, '.claude/.gsdt-planning', 'compound-memory.json');
  fs.mkdirSync(path.dirname(memoryPath), { recursive: true });

  let memory = { learnings: [] };
  if (fs.existsSync(memoryPath)) {
    try {
      memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
      if (!Array.isArray(memory.learnings)) memory = { learnings: [] };
    } catch {
      memory = { learnings: [] };
    }
  }

  const dedupeKey = research.dedupe_key || buildDedupeKey(research);
  const existingIndex = memory.learnings.findIndex(entry => entry.dedupe_key === dedupeKey);
  const existing = existingIndex >= 0 ? memory.learnings[existingIndex] : null;
  const entry = {
    id: existing?.id || `compound-${Date.now()}`,
    dedupe_key: dedupeKey,
    problem: research.problem,
    problem_type: research.problem_type,
    severity: mapSeverity(research.severity),
    solution: research.solution,
    root_cause: research.root_cause,
    solution_doc: solutionDocPath,
    date: new Date().toISOString().split('T')[0],
    tags: research.tags || [],
    source: research.source || '',
  };

  if (existingIndex >= 0) {
    memory.learnings[existingIndex] = entry;
  } else {
    memory.learnings.push(entry);
  }

  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf8');
  return entry;
}

async function updateAntiPatterns(baseDir, research) {
  const antiPatternsPath = path.join(baseDir, '.claude/.gsdt-planning', 'anti-patterns.md');
  fs.mkdirSync(path.dirname(antiPatternsPath), { recursive: true });

  const dedupeKey = research.dedupe_key || buildDedupeKey(research);
  if (fs.existsSync(antiPatternsPath)) {
    const existing = fs.readFileSync(antiPatternsPath, 'utf8');
    if (existing.includes(`**Dedupe Key**: ${dedupeKey}`)) {
      return antiPatternsPath;
    }
  }

  const entry = `\n## ${research.title || 'Anti-Pattern'} (${research.date || new Date().toISOString().split('T')[0]})\n\n**Dedupe Key**: ${dedupeKey}\n**Type**: ${research.problem_type}\n**Severity**: ${mapSeverity(research.severity)}\n**Root Cause**: ${research.root_cause}\n\n**Solution**: ${research.solution}\n\n**Prevention**: ${research.prevention || 'See solution doc'}\n\n`;
  fs.appendFileSync(antiPatternsPath, entry, 'utf8');
  return antiPatternsPath;
}

function mergeLists(left = [], right = []) {
  return Array.from(new Set([...(left || []), ...(right || [])].filter(Boolean)));
}

function findExistingEvent(store, incoming) {
  const exact = store.events.find(event => event.dedupe_key === incoming.dedupe_key);
  if (exact) return exact;

  return store.events.find(event =>
    event.problem_key === incoming.problem_key &&
    (!event.phase || !incoming.phase || event.phase === incoming.phase) &&
    (!incoming.root_cause || !event.root_cause || normalizeText(event.root_cause) === normalizeText(incoming.root_cause))
  );
}

function mergeCompoundEvent(existing, incoming) {
  const status = compareStatuses(existing.status, incoming.status) >= 0 ? existing.status : incoming.status;
  const dedupeKey = incoming.root_cause
    ? buildDedupeKey({
        problem: incoming.problem || existing.problem,
        root_cause: incoming.root_cause,
        problem_type: incoming.problem_type || existing.problem_type,
        files: mergeLists(existing.files, incoming.files),
      })
    : existing.dedupe_key || incoming.dedupe_key;

  return normalizeCompoundEvent({
    ...existing,
    ...incoming,
    id: existing.id,
    source: compareStatuses(existing.status, incoming.status) >= 0 ? existing.source : incoming.source,
    sources: mergeLists(existing.sources || [existing.source], incoming.sources || [incoming.source]),
    status,
    compound_state: existing.compound_state === 'compounded'
      ? 'compounded'
      : status === 'candidate' ? 'candidate' : 'pending',
    problem: incoming.problem || existing.problem,
    symptoms: mergeLists(existing.symptoms, incoming.symptoms),
    root_cause: incoming.root_cause || existing.root_cause,
    severity: severityRank(existing.severity) <= severityRank(incoming.severity)
      ? existing.severity
      : incoming.severity,
    problem_type: incoming.problem_type || existing.problem_type,
    files: mergeLists(existing.files, incoming.files),
    phase: incoming.phase || existing.phase,
    debug_session: incoming.debug_session || existing.debug_session,
    commit_hash: incoming.commit_hash || existing.commit_hash,
    commit_message: incoming.commit_message || existing.commit_message,
    suggested_fix: incoming.suggested_fix || existing.suggested_fix,
    missing: mergeLists(existing.missing, incoming.missing),
    tags: mergeLists(existing.tags, incoming.tags),
    dedupe_key: dedupeKey,
    created_at: existing.created_at,
    solution_doc: existing.solution_doc || incoming.solution_doc,
    memory_id: existing.memory_id || incoming.memory_id,
    last_result: incoming.last_result || existing.last_result,
  });
}

function upsertCompoundEvent(baseDir, rawEvent) {
  const incoming = normalizeCompoundEvent(rawEvent);
  const store = loadCompoundEvents(baseDir);
  const existing = findExistingEvent(store, incoming);
  const nextEvent = existing ? mergeCompoundEvent(existing, incoming) : incoming;
  const nextEvents = existing
    ? store.events.map(event => event.id === existing.id ? nextEvent : event)
    : [...store.events, nextEvent];
  saveCompoundEvents(baseDir, { events: nextEvents });
  return nextEvent;
}

function buildFallbackResearch(event) {
  const tags = mergeLists(event.tags, ['auto-compound', event.source]);
  const solutions = [];
  if (event.commit_hash) {
    solutions.push(`Review commit ${event.commit_hash.slice(0, 12)} for the exact patch that resolved this failure mode.`);
  }
  if (event.suggested_fix) solutions.push(event.suggested_fix);
  if (event.missing.length) {
    solutions.push(`Address the missing verification or implementation gaps:\n${renderList(event.missing, 'No explicit missing steps recorded')}`);
  }
  if (solutions.length === 0) {
    solutions.push('Apply the fix that directly addresses the diagnosed root cause, then verify the affected workflow end to end.');
  }

  const preventionSteps = event.missing.length
    ? renderList(event.missing.map(item => `Verify ${item}`), 'Add a regression test for this failure mode')
    : '- Add a regression test for this failure mode\n- Re-run the originating workflow before shipping';

  const examples = event.files.length
    ? `Affected files:\n${renderList(event.files, 'No files recorded')}`
    : '';

  return {
    title: event.problem.substring(0, 80) || 'Untitled compound event',
    problem: event.problem,
    symptoms: event.symptoms,
    root_cause: event.root_cause,
    solution: solutions.join('\n\n'),
    why_this_works: event.root_cause
      ? `This fix targets the diagnosed root cause: ${event.root_cause}.`
      : 'This fix targets the observed failure mode recorded by the workflow.',
    prevention: preventionSteps,
    problem_type: event.problem_type,
    severity: event.severity,
    confidence: event.status === 'resolved' ? 0.9 : 0.75,
    tags,
    examples,
    source: event.source,
    phase: event.phase,
    files: event.files,
    dedupe_key: event.dedupe_key,
    resolution_type: 'code_fix',
    debug_session: event.debug_session,
    commit_hash: event.commit_hash,
    commit_message: event.commit_message,
  };
}

async function handleHookEvent(baseDir, rawHookInput, options = {}) {
  const eventName = String(rawHookInput?.event || 'post-commit').trim().toLowerCase();
  if (eventName !== 'post-commit') {
    return {
      processed: false,
      reason: 'unsupported_hook_event',
      event: eventName || 'unknown',
    };
  }

  const event = buildPostCommitCompoundEvent(rawHookInput);
  if (!event) {
    return {
      processed: false,
      reason: 'not_relevant',
    };
  }

  return dispatchCompoundEvent(baseDir, event, options);
}

function scoreResearchCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') return -1;
  let score = Number(candidate.confidence || 0);
  const importantFields = ['problem', 'root_cause', 'solution', 'prevention', 'problem_type', 'severity'];
  score += importantFields.filter(field => candidate[field]).length;
  return score;
}

function mergeResearch(baseResearch, candidate) {
  if (!candidate) return baseResearch;
  return {
    ...baseResearch,
    ...candidate,
    tags: mergeLists(baseResearch.tags, candidate.tags),
    symptoms: mergeLists(baseResearch.symptoms, candidate.symptoms),
    files: mergeLists(baseResearch.files, candidate.files),
    dedupe_key: baseResearch.dedupe_key,
    source: baseResearch.source,
    phase: baseResearch.phase,
    debug_session: baseResearch.debug_session,
    severity: mapSeverity(candidate.severity || baseResearch.severity),
    problem_type: candidate.problem_type || baseResearch.problem_type,
  };
}

async function enrichResearchFromCli(event, baseResearch, options = {}) {
  if (options.skipResearch) return baseResearch;

  let cli;
  try {
    cli = require('./cli.cjs');
  } catch {
    return baseResearch;
  }

  if (typeof cli.getAvailableCLIs !== 'function' || typeof cli.invokeCLIsParallel !== 'function') {
    return baseResearch;
  }

  const available = await cli.getAvailableCLIs();
  if (!available.length) return baseResearch;

  const prompt = [
    'You are generating a bug-resolution learning for GSDT compound mode.',
    'Return JSON only.',
    '',
    `Source: ${event.source}`,
    `Status: ${event.status}`,
    `Problem: ${event.problem}`,
    `Symptoms: ${event.symptoms.join(' | ') || 'n/a'}`,
    `Root Cause: ${event.root_cause || 'unknown'}`,
    `Severity: ${event.severity}`,
    `Problem Type: ${event.problem_type}`,
    `Files: ${event.files.join(', ') || 'n/a'}`,
    `Suggested Fix: ${event.suggested_fix || 'n/a'}`,
    '',
    'Schema:',
    JSON.stringify({
      title: 'Short pattern title',
      problem: 'Problem summary',
      symptoms: ['symptom'],
      root_cause: 'Diagnosed root cause',
      solution: 'Actionable fix steps',
      why_this_works: 'Why the fix resolves the root cause',
      prevention: 'How to prevent recurrence',
      problem_type: 'logic_error|build_error|test_failure|runtime_error|performance_issue|database_issue|security_issue|ui_bug|integration_issue',
      severity: 'P0|P1|P2|P3',
      confidence: 0.8,
      tags: ['tag'],
      examples: 'Optional examples or file references'
    }, null, 2),
  ].join('\n');

  const results = await cli.invokeCLIsParallel(available, prompt, {
    timeout: options.researchTimeout || 60000,
  });

  let best = null;
  for (const cliName of available) {
    const result = results.get(cliName);
    if (!result?.success) continue;
    const parsed = cli.parseResearchOutput(cliName, result.output);
    const candidate = Array.isArray(parsed) ? parsed[0] : parsed;
    if (scoreResearchCandidate(candidate) > scoreResearchCandidate(best)) {
      best = candidate;
    }
  }

  return mergeResearch(baseResearch, best);
}

async function dispatchCompoundEvent(baseDir, rawEvent, options = {}) {
  const event = upsertCompoundEvent(baseDir, rawEvent);
  if (event.compound_state === 'compounded') {
    return {
      processed: false,
      reason: 'already_compounded',
      event,
      solution_doc: event.solution_doc || '',
    };
  }

  if (event.status === 'candidate') {
    const candidateEvent = {
      ...event,
      compound_state: 'candidate',
      last_result: 'candidate recorded',
    };
    const store = loadCompoundEvents(baseDir);
    saveCompoundEvents(baseDir, {
      events: store.events.map(item => item.id === event.id ? candidateEvent : item),
    });
    return {
      processed: false,
      reason: 'candidate_only',
      event: candidateEvent,
    };
  }

  try {
    const baseResearch = buildFallbackResearch(event);
    const research = await enrichResearchFromCli(event, baseResearch, options);
    const processed = await processLearnings(baseDir, [research], {
      ...options,
      minSeverity: options.minSeverity || 'P3',
    });
    const primaryDoc = processed.docs[0]?.path || '';
    const memoryEntry = await writeToMemory(baseDir, research, primaryDoc);
    await updateAntiPatterns(baseDir, research);

    const compoundedEvent = {
      ...event,
      compound_state: 'compounded',
      solution_doc: primaryDoc,
      memory_id: memoryEntry.id,
      last_result: 'compounded',
      updated_at: new Date().toISOString(),
    };
    const store = loadCompoundEvents(baseDir);
    saveCompoundEvents(baseDir, {
      events: store.events.map(item => item.id === event.id ? compoundedEvent : item),
    });

    return {
      processed: true,
      reason: 'compounded',
      event: compoundedEvent,
      solution_doc: primaryDoc,
      memory_id: memoryEntry.id,
      stats: processed.stats,
    };
  } catch (error) {
    const failedEvent = {
      ...event,
      compound_state: 'failed',
      last_result: error.message,
      updated_at: new Date().toISOString(),
    };
    const store = loadCompoundEvents(baseDir);
    saveCompoundEvents(baseDir, {
      events: store.events.map(item => item.id === event.id ? failedEvent : item),
    });

    return {
      processed: false,
      reason: 'dispatch_failed',
      error: error.message,
      event: failedEvent,
    };
  }
}

module.exports = {
  processLearnings,
  researchToDoc,
  BUG_TRACK_TYPES,
  findSolutions,
  writeToMemory,
  updateAntiPatterns,
  parseFrontmatter,
  normalizeCompoundEvent,
  loadCompoundEvents,
  dispatchCompoundEvent,
  handleHookEvent,
};
