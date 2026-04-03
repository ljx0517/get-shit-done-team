/**
 * Review Output Formatting Module
 * JSON and Markdown output formatting
 */

/**
 * Format findings as JSON
 * @param {Object} output - ReviewOutput object
 * @returns {string} JSON string
 */
function formatJSON(output) {
  return JSON.stringify(output, null, 2);
}

/**
 * Format a single finding as Markdown
 * @param {Object} finding - Finding object
 * @returns {string} Markdown formatted finding
 */
function formatFindingMarkdown(finding) {
  const lines = [];

  // Title with severity badge
  const severityBadge = `[${finding.severity}]`;
  lines.push(`### ${severityBadge} ${finding.title}`);

  // Metadata line
  const metadata = [];
  if (finding.file) {
    metadata.push(`\`${finding.file}${finding.line ? `:${finding.line}` : ''}\``);
  }
  metadata.push(finding.autofix_class);
  metadata.push(`confidence: ${(finding.confidence * 100).toFixed(0)}%`);
  if (finding.pillar) {
    metadata.push(finding.pillar);
  }
  lines.push(metadata.join(' | '));

  // Description
  lines.push('');
  lines.push(finding.description);

  // Evidence
  if (finding.evidence && finding.evidence.length > 0) {
    lines.push('');
    lines.push('**Evidence:**');
    for (const e of finding.evidence) {
      lines.push(`- \`${e}\``);
    }
  }

  // Suggestions
  if (finding.suggestions && finding.suggestions.length > 0) {
    lines.push('');
    lines.push('**Suggestions:**');
    for (const s of finding.suggestions) {
      lines.push(`- ${s}`);
    }
  }

  // Confirmed by
  if (finding.confirmed_by && finding.confirmed_by.length > 0) {
    lines.push('');
    lines.push(`*Confirmed by: ${finding.confirmed_by.join(', ')}*`);
  }

  return lines.join('\n');
}

/**
 * Format summary section as Markdown
 * @param {Object} summary - ReviewSummary object
 * @returns {string} Markdown formatted summary
 */
function formatSummaryMarkdown(summary) {
  const lines = [];

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total (raw) | ${summary.total_raw} |`);
  lines.push(`| After dedup | ${summary.total_after_dedup} |`);
  lines.push(`| After filter | ${summary.total_after_filter} |`);
  lines.push(`| Suppressed | ${summary.suppressed_count} |`);
  lines.push(`| Boosted | ${summary.boosted_count} |`);
  lines.push('');

  // By severity
  lines.push('**By Severity:**');
  lines.push('');
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  for (const [sev, count] of Object.entries(summary.by_severity)) {
    lines.push(`| ${sev} | ${count} |`);
  }
  lines.push('');

  // By autofix class
  lines.push('**By Autofix Class:**');
  lines.push('');
  lines.push(`| Autofix Class | Count |`);
  lines.push(`|----------------|-------|`);
  for (const [cls, count] of Object.entries(summary.by_autofix_class)) {
    lines.push(`| ${cls} | ${count} |`);
  }

  return lines.join('\n');
}

/**
 * Format UI pillar scores as Markdown table
 * @param {Object} pillarScores - UIPillarScores object
 * @returns {string} Markdown formatted pillar scores
 */
function formatPillarScoresMarkdown(pillarScores) {
  const lines = [];
  lines.push('## UI Pillar Scores');
  lines.push('');
  lines.push('| Pillar | Score |');
  lines.push('|--------|-------|');

  const pillarNames = {
    copywriting: 'Copywriting',
    visuals: 'Visuals',
    color: 'Color',
    typography: 'Typography',
    spacing: 'Spacing',
    experience: 'Experience',
  };

  for (const [pillar, score] of Object.entries(pillarScores)) {
    const name = pillarNames[pillar] || pillar;
    lines.push(`| ${name} | ${score}/4 |`);
  }

  const total = Object.values(pillarScores).reduce((sum, s) => sum + s, 0);
  lines.push(`| **Total** | **${total}/24** |`);

  return lines.join('\n');
}

/**
 * Format routing section as Markdown
 * @param {Object} routing - Routing object with immediate_fix, next_sprint, backlog
 * @param {Array} findings - All findings for lookup
 * @returns {string} Markdown formatted routing
 */
function formatRoutingMarkdown(routing, findings) {
  const lines = [];
  lines.push('## Routing');

  const findTitle = (id) => {
    const f = findings.find(f => f.id === id);
    return f ? f.title : id;
  };

  if (routing.immediate_fix && routing.immediate_fix.length > 0) {
    lines.push('');
    lines.push('### Immediate Fix (P0)');
    for (const id of routing.immediate_fix) {
      lines.push(`- ${findTitle(id)}`);
    }
  }

  if (routing.next_sprint && routing.next_sprint.length > 0) {
    lines.push('');
    lines.push('### Next Sprint (P1)');
    for (const id of routing.next_sprint) {
      lines.push(`- ${findTitle(id)}`);
    }
  }

  if (routing.backlog && routing.backlog.length > 0) {
    lines.push('');
    lines.push('### Backlog (P2)');
    for (const id of routing.backlog) {
      lines.push(`- ${findTitle(id)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format complete review output as Markdown
 * @param {Object} output - ReviewOutput object
 * @returns {string} Full Markdown report
 */
function formatMarkdown(output) {
  const lines = [];

  // Header
  lines.push(`# Review Report — ${output.session_id}`);
  lines.push('');
  lines.push(`**Mode:** ${output.type}`);
  if (output.phase) {
    lines.push(`**Phase:** ${output.phase}`);
  }
  if (output.pr_number) {
    lines.push(`**PR:** #${output.pr_number}`);
  }
  lines.push(`**Reviewers:** ${output.reviewers.completed.join(', ')}`);
  lines.push(`**Reviewed:** ${output.reviewed_at}`);

  // Summary
  lines.push('');
  lines.push(formatSummaryMarkdown(output.summary));

  // Findings by severity
  const bySeverity = { P0: [], P1: [], P2: [], P3: [] };
  for (const finding of output.findings) {
    if (bySeverity[finding.severity]) {
      bySeverity[finding.severity].push(finding);
    }
  }

  for (const severity of ['P0', 'P1', 'P2', 'P3']) {
    const findings = bySeverity[severity];
    if (findings.length > 0) {
      lines.push('');
      lines.push(`## ${severity} — ${severity === 'P0' ? 'Must Fix' : severity === 'P1' ? 'Should Fix' : severity === 'P2' ? 'Consider Fixing' : 'Optional'}`);
      lines.push('');
      for (const finding of findings) {
        lines.push(formatFindingMarkdown(finding));
        lines.push('');
      }
    }
  }

  // Routing
  if (output.routing) {
    lines.push(formatRoutingMarkdown(output.routing, output.findings));
  }

  // Next steps
  if (output.next_steps) {
    lines.push('');
    lines.push('## Next Steps');
    lines.push('');
    lines.push(`- Auto-fixable: ${output.next_steps.auto_fixable}`);
    lines.push(`- Requires human: ${output.next_steps.requires_human}`);
    if (output.next_steps.suggested_commit) {
      lines.push(`- Suggested commit: \`${output.next_steps.suggested_commit}\``);
    }
  }

  // UI Pillar scores (if present)
  if (output.pillar_scores) {
    lines.push('');
    lines.push(formatPillarScoresMarkdown(output.pillar_scores));
  }

  // Errors
  if (output.errors && output.errors.length > 0) {
    lines.push('');
    lines.push('## Errors');
    for (const error of output.errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join('\n');
}

/**
 * Write output to file(s)
 * @param {string} outputPath - Base output path
 * @param {Object} output - ReviewOutput object
 * @param {boolean} writeMarkdown - Whether to write markdown file
 * @returns {Object} { jsonPath, mdPath }
 */
function writeOutputFiles(outputPath, output, writeMarkdown = true) {
  const fs = require('fs');
  const path = require('path');

  // Write JSON
  const jsonPath = `${outputPath}.json`;
  fs.writeFileSync(jsonPath, formatJSON(output), 'utf8');

  // Write Markdown if requested
  let mdPath;
  if (writeMarkdown) {
    mdPath = `${outputPath}.md`;
    fs.writeFileSync(mdPath, formatMarkdown(output), 'utf8');
  }

  return { jsonPath, mdPath };
}

module.exports = {
  formatJSON,
  formatMarkdown,
  formatFindingMarkdown,
  formatSummaryMarkdown,
  formatPillarScoresMarkdown,
  formatRoutingMarkdown,
  writeOutputFiles,
};
