/**
 * CLI 调用封装
 * 动态检测 + 多策略解析
 */

const { spawn } = require('child_process');

const CLI_DEFAULTS = {
  gemini: { command: 'gemini', args: ['-p'], pipeMode: true },
  claude: { command: 'claude', args: ['-p', '--no-input'], pipeMode: true },
  codex: { command: 'codex', args: ['exec', '--skip-git-repo-check'], pipeMode: true }
};

function detectCLI(cliName) {
  return new Promise((resolve) => {
    const defaults = CLI_DEFAULTS[cliName];
    if (!defaults) return resolve({ available: false });

    const child = spawn('which', [defaults.command], {
      timeout: 5000,
      stdio: 'pipe'
    });

    child.on('close', (code) => {
      resolve({ available: code === 0, pipeMode: defaults.pipeMode });
    });
    child.on('error', () => resolve({ available: false }));
  });
}

async function getAvailableCLIs() {
  const results = await Promise.all(
    Object.keys(CLI_DEFAULTS).map(async (name) => ({
      name,
      ...await detectCLI(name)
    }))
  );
  return results.filter(r => r.available).map(r => r.name);
}

async function invokeCLI(cliName, prompt, options = {}) {
  const { timeout = 180000 } = options;
  const defaults = CLI_DEFAULTS[cliName];
  if (!defaults) return { success: false, error: 'Unknown CLI', output: '', cli: cliName };

  return new Promise((resolve) => {
    let cmd, args;

    if (defaults.pipeMode) {
      cmd = 'bash';
      args = ['-c', `echo '${prompt.replace(/'/g, "'\\''")}' | ${defaults.command} ${defaults.args.join(' ')}`];
    } else {
      cmd = defaults.command;
      args = [...defaults.args, prompt];
    }

    const child = spawn(cmd, args, { timeout, env: process.env });
    let stdout = '', stderr = '';

    child.stdout.on('data', d => stdout += d);
    child.stderr.on('data', d => stderr += d);

    child.on('close', code => resolve({
      success: code === 0,
      output: stdout.trim(),
      error: stderr.trim(),
      cli: cliName
    }));
    child.on('error', err => resolve({
      success: false, output: '', error: err.message, cli: cliName
    }));
  });
}

async function invokeCLIsParallel(cliNames, prompt, options = {}) {
  const results = await Promise.all(cliNames.map(n => invokeCLI(n, prompt, options)));
  const map = new Map();
  cliNames.forEach((n, i) => map.set(n, results[i]));
  return map;
}

function parseResearchOutput(cliName, output) {
  // JSON 解析
  try {
    const parsed = JSON.parse(output);
    if (parsed.problem || parsed.root_cause) return { ...parsed, source: cliName };
    if (Array.isArray(parsed)) return parsed.map(f => ({ ...f, source: cliName }));
  } catch {}

  // Markdown code block
  const match = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.problem || parsed.root_cause) return { ...parsed, source: cliName };
      if (Array.isArray(parsed)) return parsed.map(f => ({ ...f, source: cliName }));
    } catch {}
  }

  return null;
}

module.exports = { getAvailableCLIs, invokeCLI, invokeCLIsParallel, parseResearchOutput };
