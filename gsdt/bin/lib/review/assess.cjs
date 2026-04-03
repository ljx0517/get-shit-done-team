/**
 * Assess review orchestration
 *
 * Assess is the phase-scoped quality-closure loop that merges reviewer output,
 * routes unresolved findings, writes artifacts, and bridges resolved learnings
 * into Compound.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const filter = require('./filter.cjs');
const classify = require('./classify.cjs');
const session = require('./session.cjs');
const { dispatchCompoundEvent } = require('./compound.cjs');

const TOOLS_PATH = path.join(__dirname, '..', '..', 'gsdt-tools.cjs');
const DEFAULT_MODE = 'internal_auto';
const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_REVIEWERS = [
  'correctness-reviewer',
  'testing-reviewer',
  'maintainability-reviewer',
  'project-standards-reviewer',
  'learnings-researcher',
];

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

function uniqueStrings(values) {
  if (values === null || values === undefined || values === '') {
    return [];
  }
  return [...new Set(
    values
      .flatMap(toArray)
      .map(value => String(value).trim())
      .filter(Boolean)
  )];
}

function clampConfidence(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(1, numeric));
  }
  return 0.7;
}

function normalizeSeverity(severity, fallbackText) {
  const upper = String(severity || '').trim().toUpperCase();
  if (['P0', 'P1', 'P2', 'P3'].includes(upper)) {
    return upper;
  }
  return classify.classifySeverity(fallbackText);
}

function normalizeAutofixClass(autofixClass, fallbackText) {
  const normalized = String(autofixClass || '').trim();
  if (['safe_auto', 'gated_auto', 'manual', 'advisory'].includes(normalized)) {
    return normalized;
  }
  return classify.classifyAutofix(fallbackText);
}

function defaultOwnerForAutofix(autofixClass) {
  if (autofixClass === 'safe_auto') return 'review-fixer';
  if (autofixClass === 'gated_auto') return 'downstream-resolver';
  if (autofixClass === 'manual') return 'human';
  return 'release';
}

function normalizeScopeTier(rawFinding) {
  const scopeTier = String(rawFinding.scope_tier || '').trim();
  if (['primary', 'secondary', 'pre_existing'].includes(scopeTier)) {
    return scopeTier;
  }
  return rawFinding.pre_existing ? 'pre_existing' : 'primary';
}

function defaultFixRisk(autofixClass) {
  if (autofixClass === 'safe_auto') return 'low';
  if (autofixClass === 'gated_auto' || autofixClass === 'manual') return 'high';
  return 'medium';
}

function normalizeFixRisk(rawFinding, autofixClass) {
  const fixRisk = String(rawFinding.fix_risk || '').trim();
  if (['low', 'medium', 'high'].includes(fixRisk)) {
    return fixRisk;
  }
  return defaultFixRisk(autofixClass);
}

function defaultVerificationHint(requiresVerification) {
  return requiresVerification ? 'targeted_test' : 'none';
}

function normalizeVerificationHint(rawFinding, requiresVerification) {
  const verificationHint = String(rawFinding.verification_hint || '').trim();
  if (['none', 'targeted_test', 'focused_re-review', 'uat', 'ops_validation'].includes(verificationHint)) {
    return verificationHint;
  }
  return defaultVerificationHint(requiresVerification);
}

function severityRank(severity) {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[severity] ?? 4;
}

function compareFindings(a, b) {
  const severityDelta = severityRank(a.severity) - severityRank(b.severity);
  if (severityDelta !== 0) return severityDelta;

  const confidenceDelta = (b.confidence || 0) - (a.confidence || 0);
  if (confidenceDelta !== 0) return confidenceDelta;

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function normalizeAssessFinding(rawFinding = {}, reviewer = 'assess', index = 0) {
  const title = String(rawFinding.title || rawFinding.problem || `Finding ${index + 1}`).trim();
  const description = String(rawFinding.description || rawFinding.summary || title).trim();
  const combinedText = [
    rawFinding.severity_hint,
    title,
    description,
    rawFinding.suggested_fix,
  ].filter(Boolean).join(' ');
  const severity = normalizeSeverity(rawFinding.severity, combinedText);
  const autofixClass = normalizeAutofixClass(rawFinding.autofix_class, combinedText);
  const scopeTier = normalizeScopeTier(rawFinding);
  const requiresVerification = rawFinding.requires_verification !== undefined
    ? Boolean(rawFinding.requires_verification)
    : !(severity === 'P3' && autofixClass === 'advisory');
  const confirmedBy = uniqueStrings(rawFinding.confirmed_by && rawFinding.confirmed_by.length > 0
    ? rawFinding.confirmed_by
    : [reviewer]);
  const file = rawFinding.file || rawFinding.path || undefined;
  const line = rawFinding.line === undefined || rawFinding.line === null || rawFinding.line === ''
    ? undefined
    : Number.parseInt(rawFinding.line, 10);

  return {
    id: rawFinding.id || null,
    title,
    description,
    severity,
    why_it_matters: String(rawFinding.why_it_matters || description).trim(),
    confidence: clampConfidence(rawFinding.confidence),
    autofix_class: autofixClass,
    fix_risk: normalizeFixRisk(rawFinding, autofixClass),
    scope_tier: scopeTier,
    owner: rawFinding.owner || defaultOwnerForAutofix(autofixClass),
    requires_verification: requiresVerification,
    verification_hint: normalizeVerificationHint(rawFinding, requiresVerification),
    evidence: uniqueStrings(rawFinding.evidence),
    suggestions: uniqueStrings(rawFinding.suggestions),
    suggested_fix: rawFinding.suggested_fix ? String(rawFinding.suggested_fix).trim() : undefined,
    root_cause: rawFinding.root_cause ? String(rawFinding.root_cause).trim() : undefined,
    file,
    line: Number.isFinite(line) ? line : undefined,
    source: reviewer,
    confirmed_by: confirmedBy,
    pre_existing: Boolean(rawFinding.pre_existing),
  };
}

function countBy(items, selector, seed) {
  const counts = { ...seed };
  for (const item of items) {
    const key = selector(item);
    if (counts[key] === undefined) {
      counts[key] = 0;
    }
    counts[key] += 1;
  }
  return counts;
}

function buildAssessKey(finding) {
  return [
    String(finding.file || '').trim().toLowerCase(),
    String(finding.title || '').trim().toLowerCase(),
    String(finding.root_cause || '').trim().toLowerCase(),
  ].join('::');
}

function dedupeAssessFindings(normalizedOutputs) {
  const allFindings = [];
  const groups = new Map();

  for (const entry of normalizedOutputs) {
    for (const finding of entry.findings) {
      const withSource = {
        ...finding,
        source: entry.source,
        confirmed_by: uniqueStrings(finding.confirmed_by || [entry.source]),
      };
      allFindings.push(withSource);
      const key = buildAssessKey(withSource);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(withSource);
    }
  }

  const unique = [];
  let boostCount = 0;

  for (const group of groups.values()) {
    const primary = [...group].sort(compareFindings)[0];
    const confirmedBy = uniqueStrings(group.flatMap(item => item.confirmed_by || item.source));
    let confidence = primary.confidence;

    if (confirmedBy.length >= 2) {
      const boostedConfidence = Math.min(1, confidence + 0.10);
      if (boostedConfidence !== confidence) {
        boostCount += 1;
      }
      confidence = boostedConfidence;
    }

    unique.push({
      ...primary,
      confidence,
      confirmed_by: confirmedBy,
    });
  }

  return {
    findings: unique,
    stats: {
      original_count: allFindings.length,
      dedup_count: allFindings.length - unique.length,
      boost_count: boostCount,
      final_count: unique.length,
    },
  };
}

function mergeAssessReviewerOutputs(reviewerOutputs = [], options = {}) {
  const threshold = Number.isFinite(Number(options.threshold))
    ? Number(options.threshold)
    : DEFAULT_THRESHOLD;

  const normalizedOutputs = reviewerOutputs.map((entry, index) => {
    const source = String(entry.reviewer || entry.source || `reviewer-${index + 1}`).trim();
    const findings = toArray(entry.findings).map((finding, findingIndex) => (
      normalizeAssessFinding(finding, source, findingIndex)
    ));

    return {
      source,
      findings,
      residual_risks: uniqueStrings(entry.residual_risks),
      testing_gaps: uniqueStrings(entry.testing_gaps),
    };
  });

  const merged = dedupeAssessFindings(normalizedOutputs);
  const filtered = filter.applyFilters(merged.findings, {
    confidence_threshold: threshold,
  });
  const findings = filtered.filtered
    .map((finding, index) => ({
      ...finding,
      id: finding.id || `assess-${index + 1}`,
      confirmed_by: uniqueStrings(finding.confirmed_by || [finding.source]),
    }))
    .sort(compareFindings);

  return {
    reviewers: normalizedOutputs.map(entry => entry.source),
    findings,
    residual_risks: uniqueStrings(normalizedOutputs.flatMap(entry => entry.residual_risks)),
    testing_gaps: uniqueStrings(normalizedOutputs.flatMap(entry => entry.testing_gaps)),
    summary: {
      total_raw: merged.stats.original_count,
      total_after_dedup: merged.stats.final_count,
      total_after_filter: findings.length,
      suppressed_count: merged.stats.final_count - findings.length,
      boosted_count: merged.stats.boost_count,
      by_severity: countBy(findings, finding => finding.severity, { P0: 0, P1: 0, P2: 0, P3: 0 }),
      by_autofix_class: countBy(
        findings,
        finding => finding.autofix_class,
        { safe_auto: 0, gated_auto: 0, manual: 0, advisory: 0 }
      ),
      by_source: countBy(
        normalizedOutputs,
        entry => entry.source,
        {}
      ),
    },
  };
}

function routeAssessFindings(findings = []) {
  const safeAutoQueue = [];
  const blockingGaps = [];
  const reportOnly = [];

  for (const finding of findings) {
    if (
      finding.pre_existing
      || finding.scope_tier === 'pre_existing'
      || finding.autofix_class === 'advisory'
      || finding.severity === 'P3'
    ) {
      reportOnly.push(finding);
      continue;
    }

    if (finding.autofix_class === 'safe_auto') {
      safeAutoQueue.push(finding);
      continue;
    }

    blockingGaps.push(finding);
  }

  return {
    safe_auto_queue: safeAutoQueue,
    blocking_gaps: blockingGaps,
    report_only: reportOnly,
    summary: {
      auto_fixable_count: safeAutoQueue.length,
      blocking_count: blockingGaps.length,
      report_only_count: reportOnly.length,
    },
  };
}

function mapAssessSeverityToCompound(severity) {
  if (severity === 'P0') return 'critical';
  if (severity === 'P1') return 'major';
  if (severity === 'P2') return 'minor';
  return 'cosmetic';
}

async function emitResolvedFindingsToCompound(cwd, findings = [], phaseContext = {}, options = {}) {
  const emitted = [];

  for (const [index, rawFinding] of findings.entries()) {
    const finding = normalizeAssessFinding(rawFinding, rawFinding.source || 'assess', index);
    const result = await dispatchCompoundEvent(cwd, {
      source: 'assess',
      status: 'resolved',
      problem: finding.title,
      symptoms: uniqueStrings([finding.description, ...finding.evidence]),
      root_cause: finding.root_cause || finding.description,
      severity: mapAssessSeverityToCompound(finding.severity),
      phase: phaseContext.phase_number || null,
      files: finding.file ? [finding.file] : [],
      suggested_fix: finding.suggested_fix || undefined,
      tags: uniqueStrings([
        'assess',
        'quality-closure',
        finding.autofix_class,
        phaseContext.phase_name ? phaseContext.phase_name : null,
      ]),
    }, {
      skipResearch: Boolean(options.skipResearch),
    });

    emitted.push({
      finding_id: finding.id || `resolved-${index + 1}`,
      title: finding.title,
      processed: result.processed,
      reason: result.reason || null,
      solution_doc: result.solution_doc || null,
    });
  }

  return { emitted };
}

function parseJSONValue(value, label) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid ${label}: ${error.message}`);
  }
}

function readJSONFile(filePath, label) {
  if (!filePath) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid ${label}: ${error.message}`);
  }
}

function loadReviewerOutputs(options = {}) {
  if (options.reviewer_output_file) {
    return toArray(readJSONFile(options.reviewer_output_file, '--reviewer-output-file'));
  }
  if (options.reviewer_output_json) {
    return toArray(parseJSONValue(options.reviewer_output_json, '--reviewer-output-json'));
  }
  return [];
}

function loadResolvedFindings(options = {}) {
  if (options.resolved_findings_file) {
    return toArray(readJSONFile(options.resolved_findings_file, '--resolved-findings-file'));
  }
  if (options.resolved_findings_json) {
    return toArray(parseJSONValue(options.resolved_findings_json, '--resolved-findings-json'));
  }
  return [];
}

function getPhaseContext(cwd, phase) {
  try {
    const raw = execFileSync(process.execPath, [TOOLS_PATH, 'init', 'phase-op', String(phase)], {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return JSON.parse(raw);
  } catch (error) {
    return {
      phase_found: false,
      phase_number: String(phase),
      phase_name: null,
      phase_dir: null,
      padded_phase: String(phase).padStart(2, '0'),
    };
  }
}

function buildAssessGap(finding) {
  return {
    id: `assess-gap-${finding.id}`,
    title: finding.title,
    description: finding.description,
    severity: finding.severity,
    autofix_class: finding.autofix_class,
    owner: finding.owner,
    requires_verification: finding.requires_verification,
    verification_hint: finding.verification_hint,
    why_it_matters: finding.why_it_matters,
    fix_risk: finding.fix_risk,
    scope_tier: finding.scope_tier,
    evidence: finding.evidence,
    file: finding.file || null,
    line: finding.line || null,
    pre_existing: finding.pre_existing,
  };
}

function computeVerdict(reviewerOutputs, routing, emittedResolvedCount) {
  if (reviewerOutputs.length === 0) return 'degraded';
  if (routing.blocking_gaps.length > 0 || routing.safe_auto_queue.length > 0) {
    return 'blocking_findings';
  }
  if (emittedResolvedCount > 0) return 'auto_fixed';
  return 'clean';
}

function formatFindingLine(finding) {
  const meta = [];
  if (finding.file) {
    meta.push(`\`${finding.file}${finding.line ? `:${finding.line}` : ''}\``);
  }
  meta.push(finding.autofix_class);
  meta.push(`risk ${finding.fix_risk}`);
  meta.push(`confidence ${(finding.confidence * 100).toFixed(0)}%`);
  const lines = [`- [${finding.severity}] ${finding.title} — ${meta.join(' | ')}`];
  if (finding.why_it_matters) {
    lines.push(`  Why: ${finding.why_it_matters}`);
  }
  if (finding.requires_verification) {
    lines.push(`  Verification: ${finding.verification_hint}`);
  }
  return lines.join('\n');
}

function formatAssessMarkdown(output) {
  const lines = [];
  lines.push(`# Assess Report — Phase ${output.phase}`);
  lines.push('');
  lines.push(`Verdict: **${output.verdict}**`);
  if (output.phase_name) {
    lines.push(`Phase Name: ${output.phase_name}`);
  }
  lines.push(`Mode: ${output.mode}`);
  lines.push(`Session: ${output.session_id}`);
  lines.push(`Reviewed At: ${output.reviewed_at}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Raw findings: ${output.summary.total_raw}`);
  lines.push(`- After dedupe: ${output.summary.total_after_dedup}`);
  lines.push(`- After filter: ${output.summary.total_after_filter}`);
  lines.push(`- Suppressed: ${output.summary.suppressed_count}`);
  lines.push(`- Boosted: ${output.summary.boosted_count}`);
  lines.push('');
  lines.push('## Safe Auto Queue');
  lines.push('');
  if (output.routing.safe_auto_queue.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of output.routing.safe_auto_queue) {
      lines.push(formatFindingLine(finding));
    }
  }
  lines.push('');
  lines.push('### Assess Gaps');
  lines.push('');
  if (output.assess_gaps.length === 0) {
    lines.push('- None');
  } else {
    for (const gap of output.assess_gaps) {
      lines.push(`- [${gap.severity}] ${gap.title}`);
    }
  }
  lines.push('');
  lines.push('### Report Only');
  lines.push('');
  if (output.routing.report_only.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of output.routing.report_only) {
      lines.push(formatFindingLine(finding));
    }
  }
  lines.push('');
  lines.push('### Learnings & Past Solutions');
  lines.push('');
  if (output.compound_emissions.length === 0) {
    lines.push('- None');
  } else {
    for (const emission of output.compound_emissions) {
      if (emission.solution_doc) {
        lines.push(`- [Known Pattern] ${emission.solution_doc}`);
      }
    }
    if (!output.compound_emissions.some(emission => emission.solution_doc)) {
      lines.push('- None');
    }
  }
  lines.push('');
  lines.push('### Residual Risks');
  lines.push('');
  if (output.residual_risks.length === 0) {
    lines.push('- None');
  } else {
    for (const risk of output.residual_risks) {
      lines.push(`- ${risk}`);
    }
  }
  lines.push('');
  lines.push('### Testing Gaps');
  lines.push('');
  if (output.testing_gaps.length === 0) {
    lines.push('- None');
  } else {
    for (const gap of output.testing_gaps) {
      lines.push(`- ${gap}`);
    }
  }
  lines.push('');
  lines.push('### Compound Emissions');
  lines.push('');
  if (output.compound_emissions.length === 0) {
    lines.push('- None');
  } else {
    for (const emission of output.compound_emissions) {
      lines.push(`- ${emission.title}: ${emission.processed ? 'processed' : emission.reason || 'skipped'}`);
    }
  }
  lines.push('');
  lines.push('### Coverage');
  lines.push('');
  lines.push(`- Suppressed: ${output.summary.suppressed_count}`);
  lines.push(`- Reviewer failures: ${output.reviewers.failed.length === 0 ? 'none' : output.reviewers.failed.join(', ')}`);
  return lines.join('\n');
}

function writeAssessArtifacts(cwd, phaseContext, result) {
  if (!phaseContext.phase_dir) {
    throw new Error('Assess requires a phase directory so artifacts can be written.');
  }

  const phaseDirAbs = path.join(cwd, phaseContext.phase_dir);
  fs.mkdirSync(phaseDirAbs, { recursive: true });

  const paddedPhase = phaseContext.padded_phase
    || String(phaseContext.phase_number || result.phase).padStart(2, '0');
  const reportRel = path.posix.join(
    phaseContext.phase_dir.split(path.sep).join('/'),
    `${paddedPhase}-ASSESS.md`
  );
  const jsonRel = path.posix.join(
    phaseContext.phase_dir.split(path.sep).join('/'),
    `${paddedPhase}-ASSESS.json`
  );
  const withArtifacts = {
    ...result,
    artifacts: {
      report_path: reportRel,
      json_path: jsonRel,
    },
  };

  fs.writeFileSync(path.join(cwd, reportRel), `${formatAssessMarkdown(withArtifacts)}\n`, 'utf8');
  fs.writeFileSync(path.join(cwd, jsonRel), `${JSON.stringify(withArtifacts, null, 2)}\n`, 'utf8');

  return withArtifacts.artifacts;
}

async function reviewAssess(cwd, phase, options = {}) {
  const reviewerOutputs = loadReviewerOutputs(options);
  const resolvedFindings = loadResolvedFindings(options);
  const threshold = Number.isFinite(Number(options.threshold))
    ? Number(options.threshold)
    : DEFAULT_THRESHOLD;
  const phaseContext = getPhaseContext(cwd, phase);
  const requestedReviewers = reviewerOutputs.length > 0
    ? uniqueStrings(reviewerOutputs.map(entry => entry.reviewer || entry.source))
    : DEFAULT_REVIEWERS;
  const startedAt = Date.now();
  const sess = session.createSession(cwd, {
    type: 'assess',
    phase: String(phaseContext.phase_number || phase),
    mode: options.mode || DEFAULT_MODE,
    reviewers: requestedReviewers,
  });

  session.updateSessionStatus(cwd, sess.id, 'in_progress');

  try {
    const merged = mergeAssessReviewerOutputs(reviewerOutputs, { threshold });
    const routing = routeAssessFindings(merged.findings);
    const compound = options.skip_compound
      ? { emitted: [] }
      : await emitResolvedFindingsToCompound(cwd, resolvedFindings, phaseContext, {
          skipResearch: options.skip_research,
        });

    const output = {
      version: '1.0',
      session_id: sess.id,
      type: 'assess',
      phase: String(phaseContext.phase_number || phase),
      phase_name: phaseContext.phase_name || null,
      phase_dir: phaseContext.phase_dir || null,
      reviewed_at: new Date().toISOString(),
      mode: options.mode || DEFAULT_MODE,
      reviewers: {
        requested: requestedReviewers,
        completed: merged.reviewers,
        failed: [],
      },
      config: {
        confidence_threshold: threshold,
      },
      summary: merged.summary,
      findings: merged.findings,
      routing,
      assess_gaps: routing.blocking_gaps.map(buildAssessGap),
      residual_risks: merged.residual_risks,
      testing_gaps: merged.testing_gaps,
      compound_emissions: compound.emitted,
      verdict: computeVerdict(reviewerOutputs, routing, compound.emitted.length),
      artifacts: {
        report_path: null,
        json_path: null,
      },
      statistics: {
        duration_ms: Date.now() - startedAt,
        reviewers_completed: merged.reviewers,
        reviewers_failed: [],
      },
      errors: reviewerOutputs.length === 0
        ? ['No reviewer outputs provided; assess ran in degraded mode.']
        : [],
    };

    output.artifacts = writeAssessArtifacts(cwd, phaseContext, output);
    session.completeSession(cwd, sess.id, { findings: output.findings });
    return output;
  } catch (error) {
    session.cancelSession(cwd, sess.id, error.message);
    throw error;
  }
}

module.exports = {
  DEFAULT_REVIEWERS,
  normalizeAssessFinding,
  mergeAssessReviewerOutputs,
  routeAssessFindings,
  emitResolvedFindingsToCompound,
  formatAssessMarkdown,
  reviewAssess,
};
