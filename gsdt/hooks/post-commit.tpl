#!/bin/bash
# GSDT Compound — post-commit hook
# 自动捕获提交时的错误和警告

set -e

PROJECT_DIR="$(git rev-parse --show-toplevel)"
COMPOUND_BIN="$HOME/.claude/gsdt/bin/gsdt-tools.cjs"
COMMIT_HASH="$(git rev-parse HEAD)"

# 获取提交信息
COMMIT_MSG=$(git log -1 --format=%B)
COMMIT_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD | head -20)

# 检查提交信息中的问题信号
if echo "$COMMIT_MSG" | grep -qiE "fix|bug|hotfix|error|issue|problem|regression|patch"; then
  # 提交涉及 bug fix，记录到 compound
  node "$COMPOUND_BIN" compound hook \
    --event post-commit \
    --project-dir "$PROJECT_DIR" \
    --commit-hash "$COMMIT_HASH" \
    --commit-msg "$COMMIT_MSG" \
    --files "$COMMIT_FILES" &
fi

exit 0
