/**
 * Review Classification Module
 * Severity and AutofixClass classification for findings
 */

// Severity keyword mappings (in order of specificity)
const SEVERITY_KEYWORDS = {
  P0: ['critical', 'crash', 'security', 'data loss', 'broken', 'must fix', 'urgent', 'fatal', 'p0'],
  P1: ['high', 'important', 'significant', 'should fix', 'regression', 'major', 'p1'],
  P2: ['medium', 'minor', 'next sprint', 'moderate', 'p2'],
  P3: ['low', 'nice to have', 'optional', 'advisory', 'suggestion', 'p3'],
};

// AutofixClass keyword mappings
const AUTOFIX_KEYWORDS = {
  safe_auto: ['auto-fix', 'autofix', 'safe to auto', 'linter', 'formatter', 'simple fix', 'quick fix'],
  gated_auto: ['auto', 'needs review', 'gated', 'may break', 'conditional'],
  manual: ['manual', 'human', 'refactor', 'architectural', 'complex', 'design'],
  advisory: ['suggestion', 'consider', 'nice to have', 'advisory', 'could improve'],
};

/**
 * Classify severity based on text hints
 * @param {string} text - Text to analyze (title, description, or severity_hint)
 * @returns {string} Severity level (P0, P1, P2, P3)
 */
function classifySeverity(text) {
  if (!text) return 'P2'; // Default to P2

  const lower = text.toLowerCase();

  // Check in order of specificity (P0 first, then P1, etc.)
  for (const [severity, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return severity;
      }
    }
  }

  return 'P2'; // Default to P2 if no match
}

/**
 * Classify autofix class based on text hints
 * @param {string} text - Text to analyze
 * @returns {string} AutofixClass value
 */
function classifyAutofix(text) {
  if (!text) return 'manual'; // Default to manual

  const lower = text.toLowerCase();

  // Check safe_auto first (most specific)
  for (const keyword of AUTOFIX_KEYWORDS.safe_auto) {
    if (lower.includes(keyword)) {
      return 'safe_auto';
    }
  }

  // Then gated_auto
  for (const keyword of AUTOFIX_KEYWORDS.gated_auto) {
    if (lower.includes(keyword)) {
      return 'gated_auto';
    }
  }

  // Then advisory
  for (const keyword of AUTOFIX_KEYWORDS.advisory) {
    if (lower.includes(keyword)) {
      return 'advisory';
    }
  }

  // Default to manual
  return 'manual';
}

/**
 * Classify a raw finding
 * @param {Object} rawFinding - Raw finding object
 * @returns {Object} Finding with classified severity and autofix_class
 */
function classifyFinding(rawFinding) {
  // Combine text fields for classification
  const combinedText = [
    rawFinding.severity_hint,
    rawFinding.title,
    rawFinding.description,
  ].filter(Boolean).join(' ');

  const severity = rawFinding.severity_hint
    ? classifySeverity(rawFinding.severity_hint)
    : classifySeverity(combinedText);

  const autofix_class = classifyAutofix(combinedText);

  return {
    ...rawFinding,
    severity,
    autofix_class,
  };
}

/**
 * Classify multiple findings
 * @param {Array} findings - Array of raw findings
 * @returns {Array} Array of classified findings
 */
function runClassification(findings) {
  return findings.map(f => classifyFinding(f));
}

/**
 * Map UI score to severity
 * Score 1 -> P1 (severe UX problem)
 * Score 2 -> P2 (medium UX problem)
 * Score 3 -> P3 (minor UX problem)
 * Score 4 -> no finding (good UX)
 * @param {number} uiScore - UI score (1-4)
 * @returns {string|null} Severity or null if score is 4
 */
function mapUIScoreToSeverity(uiScore) {
  if (uiScore >= 4) return null; // No finding for good UI
  if (uiScore === 1) return 'P1';
  if (uiScore === 2) return 'P2';
  if (uiScore === 3) return 'P3';
  return 'P2'; // Default
}

/**
 * Classify a UI finding with pillar and severity
 * @param {Object} rawFinding - Raw UI finding
 * @param {string} pillar - UI pillar (copywriting, visuals, etc.)
 * @returns {Object} Classified finding
 */
function classifyUIFinding(rawFinding, pillar) {
  const uiScore = rawFinding.ui_score || 3;
  const severity = mapUIScoreToSeverity(uiScore);

  if (!severity) {
    return null; // Score 4 = no finding needed
  }

  return {
    ...rawFinding,
    pillar,
    severity,
    autofix_class: 'manual', // UI issues typically require manual fixes
    confidence: rawFinding.confidence_hint || 0.7,
  };
}

/**
 * Get routing action based on severity and autofix class
 * @param {string} severity
 * @param {string} autofixClass
 * @returns {string} Routing action
 */
function getRoutingAction(severity, autofixClass) {
  const routingMatrix = {
    'P0-safe_auto': 'immediate_fix',
    'P0-gated_auto': 'immediate_fix',
    'P0-manual': 'immediate_fix',
    'P0-advisory': 'immediate_fix',
    'P1-safe_auto': 'next_sprint',
    'P1-gated_auto': 'next_sprint',
    'P1-manual': 'next_sprint',
    'P1-advisory': 'next_sprint',
    'P2-safe_auto': 'backlog',
    'P2-gated_auto': 'backlog',
    'P2-manual': 'backlog',
    'P2-advisory': 'ignore',
    'P3-safe_auto': 'ignore',
    'P3-gated_auto': 'ignore',
    'P3-manual': 'ignore',
    'P3-advisory': 'ignore',
  };

  const key = `${severity}-${autofixClass}`;
  return routingMatrix[key] || 'backlog';
}

/**
 * Group findings by routing action
 * @param {Array} findings - Array of findings
 * @returns {Object} Grouped findings by action
 */
function groupByRouting(findings) {
  const groups = {
    immediate_fix: [],
    next_sprint: [],
    backlog: [],
    ignore: [],
  };

  for (const finding of findings) {
    const action = getRoutingAction(finding.severity, finding.autofix_class);
    if (groups[action]) {
      groups[action].push(finding.id);
    }
  }

  return groups;
}

module.exports = {
  SEVERITY_KEYWORDS,
  AUTOFIX_KEYWORDS,
  classifySeverity,
  classifyAutofix,
  classifyFinding,
  runClassification,
  mapUIScoreToSeverity,
  classifyUIFinding,
  getRoutingAction,
  groupByRouting,
};
