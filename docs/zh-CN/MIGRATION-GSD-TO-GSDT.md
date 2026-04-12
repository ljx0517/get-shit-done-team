# GSD → GSDT 迁移说明（摘要）

完整、可维护的英文版见：**[MIGRATION-GSD-TO-GSDT.md](../MIGRATION-GSD-TO-GSDT.md)**。

## 要点

1. **命名** — 面向用户的 slash 命令以 **`gsdt:`** 为准；扁平技能 / agent 以 **`gsdt-*`** 为准。旧 **`gsd:`** 在 Cursor/Windsurf 等转换路径中仍常被接受。
2. **磁盘产物** — 清单与补丁目录由 **`gsd-*`** 迁到 **`gsdt-file-manifest.json`**、**`gsdt-local-patches/`**、**`gsdt-pristine/`**；安装器在**各运行时 config 目录**上执行 **`migrateLegacyInstallArtifacts`** 自动改名（不覆盖已存在的新路径）。
3. **刻意保留** — **`~/.gsd/`**（密钥与 `defaults.json`）、GSD-2 的 **`.gsd/`** 目录语义、卸载器里的历史文件名列表等不因「品牌改名」而强行改掉。
4. **发行说明** — 逐版本变更以根目录 **`CHANGELOG.md`** 为准；本摘要文档与 **[Unreleased]**、**[1.35.0]** 条目对应。
5. **代码核对（英文正文有细节）** — Codex 将 **`/gsdt:`** 与 **`/gsd:`** 分别变成 **`$gsdt-*`** 与 **`$gsd-*`**（不会把旧前缀合并成 gsdt）；CodeBuddy 当前仅转换 **`/gsd:`**；规划根目录以 **`core.cjs` 的 `planningRoot()`** 为准（优先 **`.gsdt-planning/`**，兼容 **`.claude/.gsdt-planning/`**）。

## 相关中文参考

- [规划配置（中文）](references/planning-config.md)
- [简体中文主 README](README.md)（项目入口，非 docs 索引）
