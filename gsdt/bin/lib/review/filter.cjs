/**
 * Review Confidence Filter Module
 * Filters findings by confidence threshold with severity-based adjustments
 */

// Severity confidence thresholds
const SEVERITY_THRESHOLDS = {
  P0: 0.5,  // P0 has lower threshold to catch all critical issues
  P1: 0.55,
  P2: 0.6,
  P3: 0.65,
};

const DEFAULT_GLOBAL_THRESHOLD = 0.6;

/**
 * Get threshold for a specific severity
 * @param {string} severity - Severity level (P0, P1, P2, P3)
 * @param {number} [globalThreshold] - Global threshold override
 * @returns {number} Confidence threshold
 */
function getSeverityThreshold(severity, globalThreshold = DEFAULT_GLOBAL_THRESHOLD) {
  return SEVERITY_THRESHOLDS[severity] || globalThreshold;
}

/**
 * Check if a finding passes confidence threshold
 * @param {Object} finding - Finding object with confidence and severity
 * @param {number} [globalThreshold] - Optional global threshold override
 * @returns {boolean} True if finding passes threshold
 */
function passesThreshold(finding, globalThreshold = DEFAULT_GLOBAL_THRESHOLD) {
  const threshold = getSeverityThreshold(finding.severity, globalThreshold);
  return finding.confidence >= threshold;
}

/**
 * Filter findings by confidence threshold
 * @param {Array} findings - Array of finding objects
 * @param {Object} [options] - Filter options
 * @param {number} [options.globalThreshold] - Global confidence threshold
 * @param {boolean} [options.applySeverityAdjustment] - Apply severity-based adjustments (default: true)
 * @returns {Object} { passed: Finding[], filtered: Finding[] }
 */
function filterByConfidence(findings, options = {}) {
  const {
    globalThreshold = DEFAULT_GLOBAL_THRESHOLD,
    applySeverityAdjustment = true,
  } = options;

  const passed = [];
  const filtered = [];

  for (const finding of findings) {
    const threshold = applySeverityAdjustment
      ? getSeverityThreshold(finding.severity, globalThreshold)
      : globalThreshold;

    if (finding.confidence >= threshold) {
      passed.push(finding);
    } else {
      filtered.push(finding);
    }
  }

  return { passed, filtered };
}

/**
 * Apply all filters to findings
 * @param {Array} findings - Array of finding objects
 * @param {Object} config - Filter configuration
 * @param {number} [config.confidence_threshold] - Global confidence threshold
 * @param {boolean} [config.enable_boost] - Whether boost was applied
 * @param {Object} [options] - Additional options
 * @returns {Object} { filtered: Finding[], stats: Object }
 */
function applyFilters(findings, config = {}, options = {}) {
  const {
    confidence_threshold = DEFAULT_GLOBAL_THRESHOLD,
  } = config;

  // Step 1: Confidence filtering
  const { passed, filtered: confidenceFiltered } = filterByConfidence(findings, {
    globalThreshold: confidence_threshold,
    applySeverityAdjustment: true,
  });

  // Step 2: Filter out findings marked as duplicates
  const nonDuplicates = passed.filter(f => !f.duplicate_of);

  return {
    filtered: nonDuplicates,
    stats: {
      original_count: findings.length,
      confidence_filtered: confidenceFiltered.length,
      duplicates_filtered: passed.length - nonDuplicates.length,
      final_count: nonDuplicates.length,
    },
  };
}

/**
 * Calculate filter statistics
 * @param {Array} findings - Original findings
 * @param {Array} filtered - Filtered findings
 * @returns {Object} Statistics object
 */
function calculateFilterStats(findings, filtered) {
  const suppressed = findings.length - filtered.length;

  // Count by severity
  const bySeverity = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of filtered) {
    if (bySeverity[f.severity] !== undefined) {
      bySeverity[f.severity]++;
    }
  }

  // Count by autofix class
  const byAutofixClass = { safe_auto: 0, gated_auto: 0, manual: 0, advisory: 0 };
  for (const f of filtered) {
    if (byAutofixClass[f.autofix_class] !== undefined) {
      byAutofixClass[f.autofix_class]++;
    }
  }

  return {
    original_count: findings.length,
    suppressed_count: suppressed,
    final_count: filtered.length,
    by_severity: bySeverity,
    by_autofix_class: byAutofixClass,
  };
}

/**
 * Get a summary of why findings were filtered
 * @param {Array} filtered - Filtered findings with metadata
 * @returns {Array} Array of filter reason summaries
 */
function getFilterReasons(filtered) {
  const reasons = [];

  for (const finding of filtered) {
    const threshold = getSeverityThreshold(finding.severity);
    reasons.push({
      id: finding.id,
      title: finding.title,
      confidence: finding.confidence,
      required_threshold: threshold,
      severity: finding.severity,
    });
  }

  return reasons;
}

module.exports = {
  SEVERITY_THRESHOLDS,
  DEFAULT_GLOBAL_THRESHOLD,
  getSeverityThreshold,
  passesThreshold,
  filterByConfidence,
  applyFilters,
  calculateFilterStats,
  getFilterReasons,
};
