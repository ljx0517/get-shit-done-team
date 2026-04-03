/**
 * GSDT Unified Review System - Entry Point
 *
 * Provides unified review functionality for:
 * - Cross-AI Review (plan review with external CLIs)
 * - UI Audit (6-pillar visual audit)
 * - Ship Review (PR code review)
 */

const path = require('path');
const core = require('../core.cjs');
const session = require('./session.cjs');
const dedupe = require('./dedupe.cjs');
const filter = require('./filter.cjs');
const classify = require('./classify.cjs');
const assess = require('./assess.cjs');
const output = require('./output.cjs');

// Re-export modules for external use
module.exports = {
  // Core modules
  session,
  dedupe,
  filter,
  classify,
  output,

  // Convenience functions
  createSession: session.createSession,
  getSession: session.getSession,
  runReview: runReview,

  // Review type functions
  reviewCrossAI,
  reviewUIAudit,
  reviewShip,
  reviewAssess: assess.reviewAssess,

  // CLI command handler
  cmdReview,
};

/**
 * Run a complete review pipeline
 * @param {string} cwd - Current working directory
 * @param {Object} options - Review options
 * @returns {Object} ReviewOutput
 */
function runReview(cwd, options = {}) {
  const {
    type = 'cross-ai',
    phase,
    pr_number,
    mode = 'interactive',
    reviewers = ['gemini', 'claude'],
    threshold = 0.6,
  } = options;

  // Create session
  const sess = session.createSession(cwd, {
    type,
    phase,
    pr_number,
    mode,
    reviewers,
    config: { confidence_threshold: threshold },
  });

  core.output(`Created review session: ${sess.id}`);

  return {
    session_id: sess.id,
    status: 'pending',
  };
}

/**
 * Run Cross-AI review
 * @param {string} cwd
 * @param {string} phase - Phase number
 * @param {Object} options
 * @returns {Object} ReviewOutput
 */
async function reviewCrossAI(cwd, phase, options = {}) {
  const {
    reviewers = ['gemini', 'claude'],
    threshold = 0.6,
    json = false,
  } = options;

  // Create session
  const sess = session.createSession(cwd, {
    type: 'cross-ai',
    phase,
    reviewers,
    config: { confidence_threshold: threshold },
  });

  session.updateSessionStatus(cwd, sess.id, 'in_progress');

  try {
    // This is a placeholder - actual implementation would:
    // 1. Build review prompt from phase context
    // 2. Invoke reviewers in parallel
    // 3. Collect and parse results
    // 4. Run dedupe + filter + classify
    // 5. Generate output

    core.output(`Running Cross-AI review for phase ${phase}`);
    core.output(`Reviewers: ${reviewers.join(', ')}`);

    // Placeholder output structure
    const reviewOutput = {
      version: '2.0',
      session_id: sess.id,
      type: 'cross-ai',
      phase,
      reviewed_at: new Date().toISOString(),
      mode: options.mode || 'interactive',
      reviewers: {
        requested: reviewers,
        completed: [],
        failed: [],
      },
      config: sess.config,
      summary: {
        total_raw: 0,
        total_after_dedup: 0,
        total_after_filter: 0,
        suppressed_count: 0,
        boosted_count: 0,
        by_severity: { P0: 0, P1: 0, P2: 0, P3: 0 },
        by_autofix_class: { safe_auto: 0, gated_auto: 0, manual: 0, advisory: 0 },
        by_source: {},
      },
      findings: [],
      statistics: {
        duration_ms: 0,
        reviewers_completed: [],
        reviewers_failed: [],
      },
      errors: [],
    };

    // Complete session
    session.completeSession(cwd, sess.id, { findings: reviewOutput.findings });

    return reviewOutput;
  } catch (error) {
    session.cancelSession(cwd, sess.id, error.message);
    throw error;
  }
}

/**
 * Run UI Audit
 * @param {string} cwd
 * @param {string} phase
 * @param {Object} options
 * @returns {Object} UIAuditResult
 */
async function reviewUIAudit(cwd, phase, options = {}) {
  const {
    threshold = 0.6,
  } = options;

  const sess = session.createSession(cwd, {
    type: 'ui-audit',
    phase,
    reviewers: ['ui-auditor'],
    config: { confidence_threshold: threshold },
  });

  session.updateSessionStatus(cwd, sess.id, 'in_progress');

  try {
    core.output(`Running UI audit for phase ${phase}`);

    const reviewOutput = {
      version: '2.0',
      session_id: sess.id,
      type: 'ui-audit',
      phase,
      reviewed_at: new Date().toISOString(),
      mode: options.mode || 'interactive',
      reviewers: {
        requested: ['ui-auditor'],
        completed: [],
        failed: [],
      },
      config: sess.config,
      summary: {
        total_raw: 0,
        total_after_dedup: 0,
        total_after_filter: 0,
        suppressed_count: 0,
        boosted_count: 0,
        by_severity: { P0: 0, P1: 0, P2: 0, P3: 0 },
        by_autofix_class: { safe_auto: 0, gated_auto: 0, manual: 0, advisory: 0 },
        by_source: { 'ui-auditor': 0 },
      },
      findings: [],
      pillar_scores: {
        copywriting: 0,
        visuals: 0,
        color: 0,
        typography: 0,
        spacing: 0,
        experience: 0,
      },
      statistics: {
        duration_ms: 0,
        reviewers_completed: [],
        reviewers_failed: [],
      },
      errors: [],
    };

    session.completeSession(cwd, sess.id, { findings: reviewOutput.findings });

    return reviewOutput;
  } catch (error) {
    session.cancelSession(cwd, sess.id, error.message);
    throw error;
  }
}

/**
 * Run Ship Review
 * @param {string} cwd
 * @param {number} prNumber
 * @param {Object} options
 * @returns {Object} ReviewOutput
 */
async function reviewShip(cwd, prNumber, options = {}) {
  const {
    threshold = 0.6,
  } = options;

  const sess = session.createSession(cwd, {
    type: 'ship',
    pr_number: prNumber,
    reviewers: ['gemini', 'claude', 'codex'],
    config: { confidence_threshold: threshold },
  });

  session.updateSessionStatus(cwd, sess.id, 'in_progress');

  try {
    core.output(`Running ship review for PR #${prNumber}`);

    const reviewOutput = {
      version: '2.0',
      session_id: sess.id,
      type: 'ship',
      pr_number: prNumber,
      reviewed_at: new Date().toISOString(),
      mode: options.mode || 'interactive',
      reviewers: {
        requested: ['gemini', 'claude', 'codex'],
        completed: [],
        failed: [],
      },
      config: sess.config,
      summary: {
        total_raw: 0,
        total_after_dedup: 0,
        total_after_filter: 0,
        suppressed_count: 0,
        boosted_count: 0,
        by_severity: { P0: 0, P1: 0, P2: 0, P3: 0 },
        by_autofix_class: { safe_auto: 0, gated_auto: 0, manual: 0, advisory: 0 },
        by_source: {},
      },
      findings: [],
      routing: {
        immediate_fix: [],
        next_sprint: [],
        backlog: [],
      },
      next_steps: {
        auto_fixable: 0,
        requires_human: 0,
      },
      statistics: {
        duration_ms: 0,
        reviewers_completed: [],
        reviewers_failed: [],
      },
      errors: [],
    };

    session.completeSession(cwd, sess.id, { findings: reviewOutput.findings });

    return reviewOutput;
  } catch (error) {
    session.cancelSession(cwd, sess.id, error.message);
    throw error;
  }
}

/**
 * CLI command handler for 'gsdt-tools review ...'
 * @param {string} cwd
 * @param {Array} args - Command arguments
 * @param {Object} raw - Raw command object
 */
function cmdReview(cwd, args, raw) {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case 'create-session':
    case 'create': {
      const parsed = parseArgs(rest);
      const sess = session.createSession(cwd, {
        type: parsed.type || 'cross-ai',
        phase: parsed.phase,
        pr_number: parsed.pr,
        mode: parsed.mode,
        reviewers: parsed.reviewers,
      });
      core.output(JSON.stringify({ session_id: sess.id }));
      break;
    }

    case 'get':
    case 'show': {
      const [sessionId] = rest;
      const sess = session.getSession(cwd, sessionId);
      if (sess) {
        core.output(JSON.stringify(sess, null, 2));
      } else {
        core.error(`Session not found: ${sessionId}`);
      }
      break;
    }

    case 'list': {
      const sessions = session.listSessions(cwd);
      core.output(JSON.stringify(sessions.map(s => ({
        id: s.id,
        type: s.type,
        phase: s.phase,
        status: s.status,
        started_at: s.started_at,
      })), null, 2));
      break;
    }

    case 'cross-ai': {
      const parsed = parseArgs(rest);
      reviewCrossAI(cwd, parsed.phase, parsed).then(result => {
        if (parsed.json) {
          core.output(JSON.stringify(result, null, 2));
        } else {
          core.output(output.formatMarkdown(result));
        }
      }).catch(err => {
        core.error(`Review failed: ${err.message}`);
      });
      break;
    }

    case 'ui-audit': {
      const parsed = parseArgs(rest);
      reviewUIAudit(cwd, parsed.phase, parsed).then(result => {
        if (parsed.json) {
          core.output(JSON.stringify(result, null, 2));
        } else {
          core.output(output.formatMarkdown(result));
        }
      }).catch(err => {
        core.error(`UI audit failed: ${err.message}`);
      });
      break;
    }

    case 'ship': {
      const parsed = parseArgs(rest);
      reviewShip(cwd, parsed.pr, parsed).then(result => {
        if (parsed.json) {
          core.output(JSON.stringify(result, null, 2));
        } else {
          core.output(output.formatMarkdown(result));
        }
      }).catch(err => {
        core.error(`Ship review failed: ${err.message}`);
      });
      break;
    }

    case 'assess': {
      const parsed = parseArgs(rest);
      assess.reviewAssess(cwd, parsed.phase, parsed).then(result => {
        if (parsed.json) {
          core.output(result);
        } else {
          core.output(null, true, assess.formatAssessMarkdown(result));
        }
      }).catch(err => {
        core.error(`Assess review failed: ${err.message}`);
      });
      break;
    }

    default: {
      core.output(`Usage: gsdt-tools review <command>`);
      core.output(``);
      core.output(`Commands:`);
      core.output(`  create-session  Create a new review session`);
      core.output(`  get <id>        Get session by ID`);
      core.output(`  list            List all sessions`);
      core.output(`  cross-ai        Run Cross-AI review`);
      core.output(`  ui-audit        Run UI audit`);
      core.output(`  ship            Run ship review`);
      core.output(`  assess          Merge assess reviewer outputs`);
      core.output(``);
      core.output(`Flags:`);
      core.output(`  --phase N       Phase number`);
      core.output(`  --pr N          PR number`);
      core.output(`  --json          Output JSON`);
      core.output(`  --threshold N   Confidence threshold (default 0.6)`);
      core.output(`  --reviewer-output-file PATH   Reviewer outputs JSON file`);
      core.output(`  --reviewer-output-json JSON   Inline reviewer outputs JSON`);
      core.output(`  --resolved-findings-file PATH Resolved findings JSON file`);
      core.output(`  --resolved-findings-json JSON Inline resolved findings JSON`);
      core.output(`  --skip-compound Skip compound emission`);
    }
  }
}

/**
 * Parse command line arguments
 * @param {Array} args
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const parsed = {
    reviewers: ['gemini', 'claude'],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--phase') {
      parsed.phase = args[++i];
    } else if (arg === '--pr') {
      parsed.pr = parseInt(args[++i], 10);
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--threshold') {
      parsed.threshold = parseFloat(args[++i]);
    } else if (arg === '--mode') {
      parsed.mode = args[++i];
    } else if (arg === '--gemini') {
      parsed.reviewers.push('gemini');
    } else if (arg === '--claude') {
      parsed.reviewers.push('claude');
    } else if (arg === '--codex') {
      parsed.reviewers.push('codex');
    } else if (arg === '--all') {
      parsed.reviewers = ['gemini', 'claude', 'codex'];
    } else if (arg === '--type') {
      parsed.type = args[++i];
    } else if (arg === '--reviewer-output-file') {
      parsed.reviewer_output_file = args[++i];
    } else if (arg === '--reviewer-output-json') {
      parsed.reviewer_output_json = args[++i];
    } else if (arg === '--resolved-findings-file') {
      parsed.resolved_findings_file = args[++i];
    } else if (arg === '--resolved-findings-json') {
      parsed.resolved_findings_json = args[++i];
    } else if (arg === '--skip-compound') {
      parsed.skip_compound = true;
    } else if (arg === '--skip-research') {
      parsed.skip_research = true;
    }
  }

  return parsed;
}
