# Multi-Project Workspaces (`/gsdt:new-workspace`)

**Issue:** #1241
**Date:** 2026-03-20
**Status:** Approved

**Planning paths:** This spec uses the default layout **`.gsdt-planning/`** at the workspace root. Legacy installs may still use **`.claude/.gsdt-planning/`**; `planningRoot()` in `gsdt/bin/lib/core.cjs` accepts both. See [`docs/CONFIGURATION.md`](../../CONFIGURATION.md).

## Problem

GSDT is tied to one `.gsdt-planning/` directory per working directory. Users with multiple independent projects (monorepo-style setups with 20+ child repos) or users needing feature branch isolation in the same repo cannot run parallel GSDT sessions without manual cloning and state management.

## Solution

Three new commands that create, list, and remove **physical workspace directories** — each containing repo copies (git worktrees or clones) and an independent `.gsdt-planning/` directory.

This covers two use cases:
- **Multi-repo orchestration (A):** Workspace spanning multiple repos from a parent directory
- **Feature branch isolation (B):** Workspace containing a worktree of the current repo (special case of A where `--repos .`)

## Commands

### `/gsdt:new-workspace`

Creates a workspace directory with repo copies and its own `.gsdt-planning/`.

```
/gsdt:new-workspace --name feature-b --repos hr-ui,ZeymoAPI --path ~/workspaces/feature-b
/gsdt:new-workspace --name feature-b --repos . --strategy worktree   # same-repo isolation
```

**Arguments:**

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--name` | Yes | — | Workspace name |
| `--repos` | No | Interactive selection | Comma-separated repo paths or names |
| `--path` | No | `~/gsdt-workspaces/<name>` | Target directory |
| `--strategy` | No | `worktree` | `worktree` (lightweight, shared .git) or `clone` (fully independent) |
| `--branch` | No | `workspace/<name>` | Branch to checkout |
| `--auto` | No | false | Skip interactive questions, use defaults |

### `/gsdt:list-workspaces`

Scans `~/gsdt-workspaces/*/WORKSPACE.md` for workspace manifests. Displays table with name, path, repo count, GSDT status (has PROJECT.md, current phase).

### `/gsdt:remove-workspace`

Removes a workspace directory after confirmation. For worktree strategy, runs `git worktree remove` for each member repo first. Refuses if any repo has uncommitted changes.

## Directory Structure

```
~/gsdt-workspaces/feature-b/          # workspace root
├── WORKSPACE.md                      # manifest
├── .gsdt-planning/                        # independent GSDT planning directory
│   ├── PROJECT.md                    # (if user ran /gsdt:new-project)
│   ├── STATE.md
│   └── config.json
├── hr-ui/                            # git worktree of source repo
│   └── (repo contents on workspace/feature-b branch)
└── ZeymoAPI/                         # git worktree of source repo
    └── (repo contents on workspace/feature-b branch)
```

Key properties:
- `.gsdt-planning/` is at the workspace root, not inside any individual repo
- Each repo is a peer directory under the workspace root
- `WORKSPACE.md` is the only GSDT-specific file at the root (besides `.gsdt-planning/`)
- For `--strategy clone`, same structure but repos are full clones

## WORKSPACE.md Format

```markdown
# Workspace: feature-b

Created: 2026-03-20
Strategy: worktree

## Member Repos

| Repo | Source | Branch | Strategy |
|------|--------|--------|----------|
| hr-ui | /root/source/repos/hr-ui | workspace/feature-b | worktree |
| ZeymoAPI | /root/source/repos/ZeymoAPI | workspace/feature-b | worktree |

## Notes

[User can add context about what this workspace is for]
```

## Workflow

### `/gsdt:new-workspace` Workflow Steps

1. **Setup** — Call `init new-workspace`, parse JSON context
2. **Gather inputs** — If `--name`/`--repos`/`--path` not provided, ask interactively. For repos, show child `.git` directories in cwd as options
3. **Validate** — Target path doesn't exist (or is empty). Source repos exist and are git repos
4. **Create workspace directory** — `mkdir -p <path>`
5. **Copy repos** — For each repo:
   - Worktree: `git worktree add <workspace>/<repo-name> -b workspace/<name>`
   - Clone: `git clone <source> <workspace>/<repo-name>`
6. **Write WORKSPACE.md** — Manifest with source paths, strategy, branch
7. **Initialize .gsdt-planning/** — `mkdir -p <workspace>/.gsdt-planning`
8. **Offer /gsdt:new-project** — Ask if user wants to run project initialization in the new workspace
9. **Commit** — If commit_docs enabled, atomic commit of WORKSPACE.md
10. **Done** — Print workspace path and next steps

### Init Function (`cmdInitNewWorkspace`)

Detects:
- Child git repos in cwd (for interactive repo selection)
- Whether target path already exists
- Whether source repos have uncommitted changes
- Whether `git worktree` is available
- Default workspace base dir (`~/gsdt-workspaces/`)

Returns JSON with flags for workflow gating.

## Error Handling

### Validation Errors (Block Creation)

- **Target path exists and is non-empty** — Error with suggestion to pick a different name/path
- **Source repo path doesn't exist or isn't a git repo** — Error listing which repos failed
- **`git worktree add` fails** (e.g., branch exists) — Fall back to `workspace/<name>-<timestamp>` branch, or error if that also fails

### Graceful Handling

- **Source repo has uncommitted changes** — Warn but allow (worktrees checkout the branch fresh, don't copy working directory state)
- **Partial failure in multi-repo workspace** — Create workspace with repos that succeeded, report failures, write partial WORKSPACE.md
- **`--repos .` (current repo, case B)** — Detect repo name from directory name or git remote, use as subdirectory name

### Remove-Workspace Safety

- **Uncommitted changes in workspace repos** — Refuse removal, print which repos have changes
- **Worktree removal fails** (e.g., source repo deleted) — Warn and continue with directory cleanup
- **Confirmation** — Require explicit confirmation with workspace name typed out

### List-Workspaces Edge Cases

- **`~/gsdt-workspaces/` doesn't exist** — "No workspaces found"
- **WORKSPACE.md exists but repos inside are gone** — Show workspace, mark repos as missing

## Testing

### Unit Tests (`tests/workspace.test.cjs`)

1. `cmdInitNewWorkspace` returns correct JSON — detects child git repos, validates target path, detects git worktree availability
2. WORKSPACE.md generation — correct format with repo table, strategy, date
3. Repo discovery — identifies `.git` directories in cwd children, skips non-git directories and files
4. Validation — rejects existing non-empty target paths, rejects non-git source paths

### Integration Tests (same file)

5. Worktree creation — creates workspace, verifies repo directories are valid git worktrees
6. Clone creation — creates workspace, verifies repos are independent clones
7. List workspaces — creates two workspaces, verifies list output includes both
8. Remove workspace — creates workspace with worktrees, removes it, verifies cleanup
9. Partial failure — one valid repo + one invalid path, workspace created with valid repo only

All tests use temp directories and clean up after themselves. Follow existing `node:test` + `node:assert` patterns.

## Implementation Files

| Component | Path |
|-----------|------|
| Command: new-workspace | `commands/gsdt/new-workspace.md` |
| Command: list-workspaces | `commands/gsdt/list-workspaces.md` |
| Command: remove-workspace | `commands/gsdt/remove-workspace.md` |
| Workflow: new-workspace | `gsdt/workflows/new-workspace.md` |
| Workflow: list-workspaces | `gsdt/workflows/list-workspaces.md` |
| Workflow: remove-workspace | `gsdt/workflows/remove-workspace.md` |
| Init function | `gsdt/bin/lib/init.cjs` (add `cmdInitNewWorkspace`, `cmdInitListWorkspaces`, `cmdInitRemoveWorkspace`) |
| Routing | `gsdt/bin/gsdt-tools.cjs` (add cases to init switch) |
| Tests | `tests/workspace.test.cjs` |

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Physical directories over logical registry | Filesystem is source of truth — matches GSDT's existing cwd-based detection pattern |
| Worktree as default strategy | Lightweight (shared .git objects), fast to create, easy to clean up |
| `.gsdt-planning/` at workspace root | Gives full isolation from individual repo planning. Each workspace is an independent GSDT project |
| No central registry | Avoids state drift. `list-workspaces` scans the filesystem directly |
| Case B as special case of A | `--repos .` reuses the same machinery, no special feature-branch code needed |
| Default path `~/gsdt-workspaces/<name>` | Predictable location for `list-workspaces` to scan, keeps workspaces out of source repos |
