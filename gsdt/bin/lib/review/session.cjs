/**
 * Review Session Management
 * Handles creation, persistence, and checkpointing of review sessions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('../core.cjs');

// Review mode constants
const ReviewMode = {
  CROSS_AI: 'cross-ai',
  UI_AUDIT: 'ui-audit',
  SHIP: 'ship',
};

const ReviewSessionStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  FAILED: 'failed',
};

const ReviewPhase = {
  GATHER: 'gather',
  DEDUPE: 'dedupe',
  FILTER: 'filter',
  CLASSIFY: 'classify',
  OUTPUT: 'output',
};

const DEFAULT_CONFIG = {
  confidence_threshold: 0.6,
  p0_confidence_threshold: 0.5,
  enable_dedup: true,
  enable_boost: true,
  enable_requirements_trace: true,
  modes: {
    interactive: true,
    autofix: true,
    report: true,
    headless: true,
  },
  personas: {
    always_on: ['gemini', 'claude'],
    conditional: [],
  },
};

/**
 * Generate a unique session ID
 * @returns {string} session ID in format rev_{timestamp}_{random4chars}
 */
function generateSessionId() {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const random = crypto.randomBytes(2).toString('hex');
  return `rev_${timestamp}_${random}`;
}

/**
 * Get the review sessions directory path
 * @param {string} cwd - Current working directory
 * @returns {string} Path to sessions directory
 */
function getSessionsDir(cwd) {
  const planningDir = path.join(cwd, '.claude/.gsdt-planning', 'review-sessions');
  if (!fs.existsSync(planningDir)) {
    fs.mkdirSync(planningDir, { recursive: true });
  }
  return planningDir;
}

/**
 * Get session file path
 * @param {string} cwd
 * @param {string} sessionId
 * @returns {string}
 */
function getSessionFilePath(cwd, sessionId) {
  return path.join(getSessionsDir(cwd), `${sessionId}.json`);
}

/**
 * Create a new review session
 * @param {string} cwd - Current working directory
 * @param {Object} config - Session configuration
 * @param {string} config.type - Review type (cross-ai, ui-audit, ship)
 * @param {string} [config.phase] - Phase number
 * @param {number} [config.pr_number] - PR number for ship review
 * @param {string} [config.mode] - Review mode (interactive, autofix, report, headless)
 * @param {Array} [config.reviewers] - List of reviewers to use
 * @returns {Object} Created session object
 */
function createSession(cwd, config = {}) {
  const {
    type = ReviewMode.CROSS_AI,
    phase,
    pr_number,
    mode = 'interactive',
    reviewers = ['gemini', 'claude'],
  } = config;

  const session = {
    id: generateSessionId(),
    type,
    phase,
    pr_number,
    status: ReviewSessionStatus.PENDING,
    current_phase: ReviewPhase.GATHER,
    reviewers,
    findings: [],
    config: { ...DEFAULT_CONFIG },
    started_at: new Date().toISOString(),
    completed_at: null,
    duration_ms: null,
    checkpoint: null,
    errors: [],
    mode,
  };

  // Persist the session
  saveSession(cwd, session);
  return session;
}

/**
 * Get a session by ID
 * @param {string} cwd
 * @param {string} sessionId
 * @returns {Object|null} Session object or null if not found
 */
function getSession(cwd, sessionId) {
  const filePath = getSessionFilePath(cwd, sessionId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    core.error(`Failed to read session ${sessionId}: ${error.message}`);
    return null;
  }
}

/**
 * Save session to disk
 * @param {string} cwd
 * @param {Object} session
 */
function saveSession(cwd, session) {
  const filePath = getSessionFilePath(cwd, session.id);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf8');
}

/**
 * List all sessions, optionally filtered by status
 * @param {string} cwd
 * @param {string} [statusFilter] - Optional status to filter by
 * @returns {Array} List of sessions
 */
function listSessions(cwd, statusFilter) {
  const sessionsDir = getSessionsDir(cwd);
  if (!fs.existsSync(sessionsDir)) {
    return [];
  }

  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
  const sessions = files.map(file => {
    try {
      const content = fs.readFileSync(path.join(sessionsDir, file), 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (statusFilter) {
    return sessions.filter(s => s.status === statusFilter);
  }
  return sessions;
}

/**
 * Update session phase
 * @param {string} cwd
 * @param {string} sessionId
 * @param {string} phase
 */
function updateSessionPhase(cwd, sessionId, phase) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.current_phase = phase;
  saveSession(cwd, session);
}

/**
 * Update session status
 * @param {string} cwd
 * @param {string} sessionId
 * @param {string} status
 */
function updateSessionStatus(cwd, sessionId, status) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.status = status;
  if (status === ReviewSessionStatus.DONE || status === ReviewSessionStatus.FAILED) {
    session.completed_at = new Date().toISOString();
    if (session.started_at) {
      session.duration_ms = new Date(session.completed_at) - new Date(session.started_at);
    }
  }
  saveSession(cwd, session);
}

/**
 * Complete a session
 * @param {string} cwd
 * @param {string} sessionId
 * @param {Object} [options] - Optional completion options
 */
function completeSession(cwd, sessionId, options = {}) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.status = ReviewSessionStatus.DONE;
  session.completed_at = new Date().toISOString();
  if (session.started_at) {
    session.duration_ms = new Date(session.completed_at) - new Date(session.started_at);
  }
  if (options.findings) {
    session.findings = options.findings;
  }
  saveSession(cwd, session);
}

/**
 * Cancel a session
 * @param {string} cwd
 * @param {string} sessionId
 * @param {string} [reason] - Cancellation reason
 */
function cancelSession(cwd, sessionId, reason) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.status = ReviewSessionStatus.FAILED;
  session.completed_at = new Date().toISOString();
  if (reason) {
    session.errors.push(reason);
  }
  saveSession(cwd, session);
}

/**
 * Save checkpoint for resumable sessions
 * @param {string} cwd
 * @param {string} sessionId
 * @param {string} phase - Current phase
 * @param {Object} data - Checkpoint data
 */
function saveCheckpoint(cwd, sessionId, phase, data) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.checkpoint = {
    phase,
    data,
    saved_at: new Date().toISOString(),
  };
  saveSession(cwd, session);
}

/**
 * Get checkpoint for a session
 * @param {string} cwd
 * @param {string} sessionId
 * @returns {Object|null} Checkpoint data or null
 */
function getCheckpoint(cwd, sessionId) {
  const session = getSession(cwd, sessionId);
  if (!session || !session.checkpoint) {
    return null;
  }
  return session.checkpoint;
}

/**
 * Clear checkpoint for a session
 * @param {string} cwd
 * @param {string} sessionId
 */
function clearCheckpoint(cwd, sessionId) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.checkpoint = null;
  saveSession(cwd, session);
}

/**
 * Add findings to session
 * @param {string} cwd
 * @param {string} sessionId
 * @param {Array} findings - Findings to add
 */
function addFindings(cwd, sessionId, findings) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.findings = session.findings.concat(findings);
  saveSession(cwd, session);
}

/**
 * Add error to session
 * @param {string} cwd
 * @param {string} sessionId
 * @param {string} error - Error message
 */
function addError(cwd, sessionId, error) {
  const session = getSession(cwd, sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }
  session.errors.push(error);
  saveSession(cwd, session);
}

/**
 * Delete a session
 * @param {string} cwd
 * @param {string} sessionId
 */
function deleteSession(cwd, sessionId) {
  const filePath = getSessionFilePath(cwd, sessionId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  createSession,
  getSession,
  saveSession,
  listSessions,
  updateSessionPhase,
  updateSessionStatus,
  completeSession,
  cancelSession,
  saveCheckpoint,
  getCheckpoint,
  clearCheckpoint,
  addFindings,
  addError,
  deleteSession,
  generateSessionId,
};
