# Migration guide: GSD → GSDT naming and artifacts

This document consolidates how this repository moved from **GSD / `gsd:` / `gsd-*`** user-facing identifiers to **GSDT / `gsdt:` / `gsdt-*`**, what the installer does automatically, and what is **intentionally unchanged** for compatibility.

For release-by-release notes, see [`CHANGELOG.md`](../CHANGELOG.md) (sections **[1.35.0]** and **[Unreleased]**).

---

## 1. Why migrate

- **Clear product identity** — GSDT is the fork’s supported name; docs and prompts use **`gsdt:`** slash commands and **`gsdt-*`** agents/skills.
- **Coexistence** — Older prompts and installs may still mention **`gsd:`**; converters and the installer accept **legacy** names where needed so existing users are not broken in one step.

---

## 2. User-facing naming

| Area | Legacy (still recognized in many paths) | Current (preferred) |
|------|----------------------------------------|----------------------|
| Slash commands | `gsd:plan-phase`, … | `gsdt:plan-phase`, … |
| Flattened skills / CLI-style invocations | `gsd-plan-phase`, … | `gsdt-plan-phase`, … |
| Managed agent files | `gsd-*-reviewer.md`, … | `gsdt-*-reviewer.md`, … |
| Doc generation marker | `<!-- generated-by: gsd-doc-writer -->` | `<!-- generated-by: gsdt-doc-writer -->` (both may be detected) |
| Git branch templates (defaults in `config.json`) | Examples often showed `gsd/...` | Defaults are **`gsdt/phase-{phase}-{slug}`**, **`gsdt/{milestone}-{slug}`** |

**Runtime behavior** (verified against `bin/install.js` converters)

- **Cursor / Windsurf (markdown skills)** — `convertSlashCommandsToCursorSkillMentions` / `convertSlashCommandsToWindsurfSkillMentions` replace **`gsdt:` → `gsdt-`** and **`gsd:` → `gsd-`** in copied markdown so both prefixes keep working in body text.
- **Codex** — `convertSlashCommandsToCodexSkillMentions` maps **`/gsdt:cmd` → `$gsdt-cmd`** and **`/gsd:cmd` → `$gsd-cmd`** (legacy **`$gsd-*`** is preserved, not rewritten to **`gsdt-*`**). Hyphen forms **`/gsdt-…`** / **`/gsd-…`** are handled similarly.
- **Copilot / Antigravity** — CONV-07 style replacement: **`gsdt:` → `gsdt-`**, **`gsd:` → `gsd-`** in `convertClaudeToCopilotContent` / `convertClaudeToAntigravityContent`. The shipped Copilot instructions template (**`gsdt/templates/copilot-instructions.md`**) emphasizes **`gsdt:*` / `gsdt-*`** and mentions legacy **`gsd:*`** where relevant.
- **CodeBuddy** — `convertSlashCommandsToCodebuddySkillMentions` currently only rewrites **`/gsd:…` → `/gsd-…`** (no **`/gsdt:`** rule in that helper). For CodeBuddy installs, body text may still need upstream alignment if you rely on **`/gsdt:`** in markdown.

---

## 3. Paths on disk (install layout)

| Artifact | Legacy name | Current name |
|----------|-------------|--------------|
| Install manifest | `gsd-file-manifest.json` | **`gsdt-file-manifest.json`** |
| Local patch backups | `gsd-local-patches/` | **`gsdt-local-patches/`** |
| Pristine snapshots | `gsd-pristine/` | **`gsdt-pristine/`** |
| Engine / commands under config | `.../gsd/` (older docs) | **`.../gsdt/`** (see `GSDT_INSTALL_DIR`) |

**Automatic migration (installer)**

- On install, **`migrateLegacyInstallArtifacts(configDir)`** runs on the **runtime config directory** (e.g. `~/.claude`, `~/.codeium/windsurf`, project-local `.claude`, …) **before** **`saveLocalPatches`**: if the **new** path is missing but the **old** exists, the installer **renames** manifest / patch dir / pristine dir to the **`gsdt-*`** names.
- If **both** old and new exist, it **does not overwrite**; a hint is logged.
- **`reportLocalPatches`** can read **`backup-meta.json`** from the legacy patch directory when the new tree has none.
- **Uninstall** also removes a leftover **`gsd-file-manifest.json`** when appropriate.

Tests: [`tests/legacy-install-artifacts-migrate.test.cjs`](../tests/legacy-install-artifacts-migrate.test.cjs).

---

## 4. Planning directory and hooks

- **Planning root** — Implemented in **`gsdt/bin/lib/core.cjs`** as **`planningRoot()`**: prefers **`./.gsdt-planning/`** when present; otherwise falls back to **`.claude/.gsdt-planning/`** (legacy). If neither exists, new work defaults to **`.gsdt-planning/`**. Root READMEs, **`CONTRIBUTING.md`**, agent prompts (e.g. **`gsdt-codebase-mapper`**), and design specs should describe the default path; **`CONFIGURATION.md`** and **`core.cjs`** are authoritative for resolution order.
- **Update check cache** — SessionStart hook still writes a **legacy filename** **`gsd-update-check.json`** under `<config>/cache/`; statusline also uses **`~/.cache/gsdt/gsdt-update-check.json`**. See [`ARCHITECTURE.md`](ARCHITECTURE.md) (hooks section).

---

## 5. Intentionally *not* renamed (compatibility)

| Item | Reason |
|------|--------|
| **`~/.gsd/`** (API key files, `defaults.json`) | Existing user machines and `config.cjs` paths still reference this directory. |
| **GSD-2 import** — `.gsd/` project directory | Denotes the **GSD-2** on-disk format; command **`from-gsd2`** / `lib/gsd2-import.cjs`. |
| **Uninstall orphan lists** in `bin/install.js` | Historical filenames (e.g. old hook names) are listed so cleanup remains complete. |
| **CHANGELOG history** | Older entries may still say `gsd:` for historical accuracy; new work is documented under **`gsdt:`** in current sections. |

---

## 6. What you should do as a user

1. **Upgrade** — Run the current installer (`npx gsdt@latest` or your usual flags). Let **`migrateLegacyInstallArtifacts`** move manifest/patch paths when applicable.
2. **Prefer new commands** — Type **`/gsdt:…`** in Claude-style runtimes; update snippets and team docs over time.
3. **Regenerate or touch docs** — New generated docs should use the **`gsdt-doc-writer`** marker; old **`gsd-doc-writer`** markers may still be recognized by [`gsdt/bin/lib/docs.cjs`](../gsdt/bin/lib/docs.cjs).
4. **Clear stale update indicators** — After upgrades, if needed, clear **`gsd-update-check.json`** under runtime cache dirs and **`~/.cache/gsdt/gsdt-update-check.json`** (see [`gsdt/workflows/update.md`](../gsdt/workflows/update.md)).

---

## 7. Related documentation

| Topic | Document |
|-------|----------|
| Commands and syntax | [`COMMANDS.md`](COMMANDS.md) |
| Config defaults (branch templates, etc.) | [`CONFIGURATION.md`](CONFIGURATION.md) |
| Planning keys and git templates | [`../gsdt/references/planning-config.md`](../gsdt/references/planning-config.md) |
| Command → workflow → artifact | [`REFERENCE-MAP.md`](REFERENCE-MAP.md) |
| Internal design | [`ARCHITECTURE.md`](ARCHITECTURE.md) |

---

## 8. Changelog pointers

- **Terminology sweep** — [`CHANGELOG.md`](../CHANGELOG.md) **[Unreleased] → Changed** — “Terminology: `gsd:` → `gsdt:`” and README/planning-doc alignment.
- **Legacy artifact migration** — Same section **[Unreleased] → Added**.
- **Upstream merge (installers, runtimes, new commands)** — **[1.35.0]**.
