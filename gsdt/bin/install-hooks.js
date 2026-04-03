#!/usr/bin/env node
/**
 * GSDT Hooks Installer
 * 安装 GSDT compound hooks 到项目 .git/hooks/
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function resolveGitHookDir(cwd) {
  try {
    const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const resolvedGitDir = path.isAbsolute(gitDir) ? gitDir : path.resolve(cwd, gitDir);
    return path.join(resolvedGitDir, 'hooks');
  } catch {
    console.error('GSDT hook install failed: current directory is not a git repository.');
    process.exit(1);
  }
}

const templatePath = path.join(__dirname, '..', 'hooks', 'post-commit.tpl');
const hookContent = fs.readFileSync(templatePath, 'utf8');

const gitHookDir = resolveGitHookDir(process.cwd());
const hookPath = path.join(gitHookDir, 'post-commit');

fs.mkdirSync(gitHookDir, { recursive: true });
fs.writeFileSync(hookPath, hookContent);
fs.chmodSync(hookPath, '755');

console.log('GSDT compound hooks installed to .git/hooks/post-commit');
