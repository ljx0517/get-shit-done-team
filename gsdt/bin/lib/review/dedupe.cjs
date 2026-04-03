/**
 * Review Deduplication Module
 * Fingerprint-based deduplication and cross-reviewer boost
 */

const crypto = require('crypto');

/**
 * Generate a fingerprint for a finding
 * @param {string} file - File path
 * @param {number} line - Line number
 * @param {string} title - Finding title
 * @returns {string} 12-character hex fingerprint
 */
function generateFingerprint(file, line, title) {
  if (!file && !line && !title) {
    // Generate random fingerprint for findings without location
    return crypto.randomBytes(6).toString('hex').substring(0, 12);
  }
  const input = `${file || ''}:${line || 0}:${(title || '').toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 12);
}

/**
 * Deduplicate findings based on fingerprint
 * Groups findings by fingerprint and keeps the highest confidence one
 * @param {Array} findings - Array of finding objects
 * @returns {Object} { unique: Finding[], duplicates: Finding[][] }
 */
function deduplicateFindings(findings) {
  const groups = new Map();

  // Group by fingerprint
  for (const finding of findings) {
    const fp = finding.fingerprint || generateFingerprint(finding.file, finding.line, finding.title);
    if (!groups.has(fp)) {
      groups.set(fp, []);
    }
    groups.get(fp).push(finding);
  }

  const unique = [];
  const duplicates = [];

  for (const [fingerprint, group] of groups) {
    if (group.length === 1) {
      unique.push(group[0]);
    } else {
      // Multiple findings with same fingerprint - keep highest confidence
      const sorted = [...group].sort((a, b) => b.confidence - a.confidence);
      const primary = { ...sorted[0] };
      primary.fingerprint = fingerprint;
      primary.confirmed_by = group.map(f => f.source);
      unique.push(primary);

      // Store duplicates for reference
      duplicates.push(group.slice(1));
    }
  }

  return { unique, duplicates };
}

/**
 * Apply confidence boost for findings confirmed by multiple reviewers
 * @param {Array} findings - Array of finding objects
 * @returns {Object} { boosted: Finding[], boost_count: number }
 */
function applyConfidenceBoost(findings) {
  let boostCount = 0;

  const boosted = findings.map(finding => {
    const confirmedBy = finding.confirmed_by || [];
    if (confirmedBy.length >= 2) {
      // 2+ confirmers: boost by 0.10
      const newConfidence = Math.min(1.0, finding.confidence + 0.10);
      if (newConfidence !== finding.confidence) {
        boostCount++;
      }
      return { ...finding, confidence: newConfidence };
    }
    return finding;
  });

  return { boosted, boost_count: boostCount };
}

/**
 * Process raw findings: deduplicate and boost
 * @param {Array} rawFindings - Array of raw finding objects
 * @returns {Object} { findings: Finding[], stats: { dedup_count: number, boost_count: number } }
 */
function processFindings(rawFindings) {
  // Generate fingerprints for all raw findings
  const withFingerprints = rawFindings.map(f => ({
    ...f,
    fingerprint: generateFingerprint(f.file, f.line, f.title),
  }));

  // Deduplicate
  const { unique, duplicates } = deduplicateFindings(withFingerprints);
  const dedupCount = rawFindings.length - unique.length;

  // Apply cross-reviewer boost
  const { boosted, boost_count } = applyConfidenceBoost(unique);

  return {
    findings: boosted,
    stats: {
      original_count: rawFindings.length,
      dedup_count: dedupCount,
      boost_count,
      final_count: boosted.length,
    },
  };
}

/**
 * Merge findings from multiple reviewers
 * @param {Array} reviewerResults - Array of { source, findings } objects
 * @returns {Object} { merged: Finding[], stats: Object }
 */
function mergeReviewerFindings(reviewerResults) {
  const allFindings = [];

  for (const { source, findings } of reviewerResults) {
    for (const finding of findings) {
      allFindings.push({
        ...finding,
        source,
        confirmed_by: finding.confirmed_by || [source],
      });
    }
  }

  return processFindings(allFindings);
}

/**
 * Create a fingerprint-only lookup for quick dedup checking
 * @param {Array} findings - Existing findings
 * @returns {Map} fingerprint -> finding map
 */
function buildFingerprintIndex(findings) {
  const index = new Map();
  for (const finding of findings) {
    const fp = finding.fingerprint || generateFingerprint(finding.file, finding.line, finding.title);
    if (!index.has(fp)) {
      index.set(fp, []);
    }
    index.get(fp).push(finding);
  }
  return index;
}

/**
 * Check if a new finding is a duplicate of an existing one
 * @param {Object} newFinding - New finding to check
 * @param {Map} fingerprintIndex - Existing fingerprint index
 * @returns {Object|null} Existing finding if duplicate, null otherwise
 */
function isDuplicate(newFinding, fingerprintIndex) {
  const fp = newFinding.fingerprint || generateFingerprint(newFinding.file, newFinding.line, newFinding.title);
  const duplicates = fingerprintIndex.get(fp);
  if (duplicates && duplicates.length > 0) {
    return duplicates[0]; // Return first match
  }
  return null;
}

module.exports = {
  generateFingerprint,
  deduplicateFindings,
  applyConfidenceBoost,
  processFindings,
  mergeReviewerFindings,
  buildFingerprintIndex,
  isDuplicate,
};
