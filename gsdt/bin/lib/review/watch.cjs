/**
 * Compound Watch — 后台监控守护进程
 * 持续监控文件系统，自动捕获错误并触发 compound
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { planningRoot, planningDirDisplay } = require('../core.cjs');

const ERROR_PATTERNS = [
  /error:/i, /exception/i, /panic/i,
  /failed/i, /failure/i, /timeout/i,
  /OOM/i, /out of memory/i, /memory leak/i,
  /N\+1/i, /race condition/i, /deadlock/i,
  /assertion failed/i, /segmentation fault/i,
  /SIGSEGV/i, /SIGABRT/i, /core dumped/i
];

const WATCH_EXTENSIONS = ['.log', '.err', '.out'];

class CompoundWatch {
  constructor(projectDir, options = {}) {
    this.projectDir = projectDir;
    this.interval = options.interval || 5000; // 5秒
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.watchedFiles = new Map(); // path -> lastSize
    this.running = false;
  }

  async start() {
    console.log(`◆ Compound Watch started: ${this.projectDir}`);
    console.log(`  Interval: ${this.interval}ms`);
    console.log(`  Watching for error patterns...`);

    this.running = true;
    this.scanInitial();

    while (this.running) {
      await this.checkFiles();
      await this.sleep(this.interval);
    }
  }

  stop() {
    this.running = false;
    console.log('◆ Compound Watch stopped');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  scanInitial() {
    // 初始化：扫描所有日志文件，记录大小
    const files = this.findLogFiles();
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        this.watchedFiles.set(file, stat.size);
      } catch {}
    }
  }

  findLogFiles() {
    // 递归查找日志文件
    const result = [];
    const search = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            search(fullPath);
          } else if (WATCH_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            result.push(fullPath);
          }
        }
      } catch {}
    };

    search(this.projectDir);
    return result;
  }

  async checkFiles() {
    for (const [filePath, lastSize] of this.watchedFiles) {
      try {
        const stat = fs.statSync(filePath);
        if (stat.size > lastSize) {
          // 文件有增量
          const newContent = this.readNewContent(filePath, lastSize, stat.size);
          this.checkForErrors(filePath, newContent);
          this.watchedFiles.set(filePath, stat.size);
        }
      } catch {}
    }

    // 检查新文件
    const currentFiles = this.findLogFiles();
    for (const file of currentFiles) {
      if (!this.watchedFiles.has(file)) {
        this.watchedFiles.set(file, 0);
      }
    }
  }

  readNewContent(filePath, from, to) {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(to - from);
      fs.readSync(fd, buffer, 0, buffer.length, from);
      fs.closeSync(fd);
      return buffer.toString('utf8');
    } catch {
      return '';
    }
  }

  checkForErrors(filePath, content) {
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(content)) {
        this.triggerCapture(filePath, content, pattern);
        break;
      }
    }
  }

  triggerCapture(filePath, content, pattern) {
    console.log(`◆ Error pattern detected: ${pattern}`);
    console.log(`  File: ${filePath}`);

    // 提取上下文（前 1000 字符）
    const errorContext = content.substring(0, 1000);

    // 记录到 auto-captures.json
    const capturesPath = path.join(planningRoot(this.projectDir), 'auto-captures.json');
    let captures = { entries: [] };
    if (fs.existsSync(capturesPath)) {
      try {
        captures = JSON.parse(fs.readFileSync(capturesPath, 'utf8'));
      } catch {}
    }

    captures.entries.push({
      pattern: String(pattern),
      file: filePath,
      context: errorContext,
      timestamp: new Date().toISOString(),
      source: 'watch-daemon'
    });

    fs.writeFileSync(capturesPath, JSON.stringify(captures, null, 2), 'utf8');
    console.log(`  Captured to ${planningDirDisplay(this.projectDir)}/auto-captures.json`);
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const projectDir = args.find(a => !a.startsWith('--')) || process.cwd();
  const options = {};

  for (const arg of args) {
    if (arg.startsWith('--interval=')) {
      options.interval = parseInt(arg.split('=')[1]);
    }
  }

  const watch = new CompoundWatch(projectDir, options);

  process.on('SIGINT', () => watch.stop());
  process.on('SIGTERM', () => watch.stop());

  watch.start().catch(console.error);
}

module.exports = { CompoundWatch };
