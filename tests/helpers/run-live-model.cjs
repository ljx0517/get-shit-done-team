/**
 * Run a live model command for intake prompt tests.
 */
const { execSync } = require('child_process');

const LIVE_MODEL_COMMAND_ENV = 'GSDT_INTAKE_LIVE_MODEL_COMMAND';
const LIVE_MODEL_TIMEOUT_ENV = 'GSDT_INTAKE_LIVE_MODEL_TIMEOUT_MS';

function isLiveModelConfigured() {
  return Boolean(process.env[LIVE_MODEL_COMMAND_ENV] && process.env[LIVE_MODEL_COMMAND_ENV].trim());
}

function liveModelCommand() {
  return String(process.env[LIVE_MODEL_COMMAND_ENV] || '').trim();
}

function liveModelTimeoutMs(override) {
  const raw = override || process.env[LIVE_MODEL_TIMEOUT_ENV] || '60000';
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
}

function runLiveModel(prompt, { timeoutMs, extraEnv } = {}) {
  if (!isLiveModelConfigured()) {
    throw new Error(`Missing ${LIVE_MODEL_COMMAND_ENV}`);
  }

  const command = liveModelCommand();
  const effectiveTimeoutMs = liveModelTimeoutMs(timeoutMs);

  try {
    const stdout = execSync(command, {
      input: prompt,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.env.SHELL || '/bin/zsh',
      timeout: effectiveTimeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        ...extraEnv,
      },
    });

    return {
      command,
      timeout_ms: effectiveTimeoutMs,
      stdout: String(stdout || ''),
    };
  } catch (error) {
    const stdout = error.stdout ? String(error.stdout) : '';
    const stderr = error.stderr ? String(error.stderr) : '';
    const message = [
      `Live model command failed: ${command}`,
      `timeout_ms=${effectiveTimeoutMs}`,
      stdout ? `stdout:\n${stdout}` : null,
      stderr ? `stderr:\n${stderr}` : null,
    ].filter(Boolean).join('\n\n');
    throw new Error(message);
  }
}

module.exports = {
  LIVE_MODEL_COMMAND_ENV,
  LIVE_MODEL_TIMEOUT_ENV,
  isLiveModelConfigured,
  runLiveModel,
};
