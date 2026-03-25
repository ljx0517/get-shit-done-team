---
description: Fragment capture workflow — AI-driven entity extraction and graph inference
---

# Capture Workflow

You are executing `gsd:capture`. The user's raw fragment is in `<context>`.

## Step 0 — 项目状态检测

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs verify-path-exists "$(pwd)/.planning/ROADMAP.md"
```

- 存在 → 已初始化项目，跳至 Step 1（正常流程）
- 不存在 → 冷启动模式，跳至 Step 0b

---

## Step 0b — 冷启动：先保存碎片，再判断是否足够

先执行 Step 1-4 完成本次碎片的保存，然后继续：

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs capture fragments
```

AI 判断：这些碎片合在一起，能否描述一个可以开始规划的项目？

**判断标准（AI 自主评估）：**
- 能推断出项目的核心目的
- 能推断出至少 1 个可执行的功能点

**若「不够」：**
显示已积累的实体数和碎片数，提示继续输入。停止。

**若「足够」：**
继续 Step 0c。

---

## Step 0c — 自动创建 config.json（写死默认值，跳过配置问题）

```bash
mkdir -p .planning
node ~/.claude/get-shit-done/bin/gsd-tools.cjs config-new-project \
  '{"mode":"yolo","granularity":"fine","parallelization":true,"commit_docs":true,"model_profile":"balanced","workflow":{"research":true,"plan_check":true,"verifier":true,"nyquist_validation":true,"auto_advance":true}}'

node ~/.claude/get-shit-done/bin/gsd-tools.cjs commit "chore: add project config" --files .planning/config.json
node ~/.claude/get-shit-done/bin/gsd-tools.cjs config-set workflow._auto_chain_active true
```

---

## Step 0d — 合并碎片，执行 new-project 后续步骤

将所有碎片原始文本合并为 idea document：
```
[片段1内容]
[片段2内容]
...
```

作为 AI，代入 `/gsd:new-project --auto` 工作流的 Step 4 开始执行（已有 config.json，跳过 Step 2a）：

- **Step 4：** 从 idea document 生成 PROJECT.md（不询问用户，AI 自行推断缺失信息）
- **Step 6：** 并行启动 4 个研究 agent（STACK / FEATURES / ARCHITECTURE / PITFALLS）
- **Step 7：** 自动生成 REQUIREMENTS.md（auto-include 所有 table stakes）
- **Step 8：** 启动 gsd-roadmapper 生成 ROADMAP.md（auto-approve）

任何信息 gap 由 AI research 填补，不询问用户。

---

## Step 0e — 自动进入 discuss-phase 1

new-project 完成后，立即执行 discuss-phase 工作流（phase 1）。

---

## Step 1 — Validate input

If `<context>` is empty or missing, respond:
```
请提供碎片内容，例如：/gsd:capture 我想做一个 X 功能
```
Then stop.

## Step 2 — Read existing graph

Run:
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs capture graph
```

This shows current nodes and edges. Use this as context for inference.

## Step 3 — AI inference

Given the fragment text and the existing graph, determine:

**A. Intent** — one of: `add` / `modify` / `unknown`

**B. Entities** — noun phrases or concepts that represent functional units in THIS project. Do not use generic pre-set terms. Extract from the fragment itself. Examples:
- Fragment: "我想做用户登录" → entities: `user-login`
- Fragment: "需要一个数据导出功能" → entities: `data-export`
- Fragment: "支持多语言" → entities: `i18n`

**C. New nodes** — entities not yet present in the graph (subset of entities above)

**D. New edges** — inferred relationships between nodes (existing + new) that are implied by the fragment or logically follow. Format: `src:dst`. Only add edges that are clearly implied — do not over-infer.

## Step 4 — Save fragment

Run the save command with your inference results:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs capture save \
  --text "<EXACT_FRAGMENT_TEXT>" \
  --intent "<intent>" \
  --entities "<e1,e2,...>" \
  --nodes "<new_node1,new_node2,...>" \
  --edges "<src1:dst1,src2:dst2,...>"
```

If entities/nodes/edges are empty, pass empty string `""`.

## Step 5 — Present results

Parse the command output and display:

```
碎片已捕获: <fragment_id>
意图: <intent>
实体: <entities or "未识别">
新增节点: <new_nodes or "无">
新增关系: <new_edges or "无">

图谱状态: <nodeCount> 节点 / <edgeCount> 边
```

## Step 6 — AI 触发判断（仅已初始化项目）

读取所有碎片内容：
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs capture fragments
```

AI 综合图谱统计（nodeCount / edgeCount / multiEvidenceCount）+ 碎片内容，判断：
**「积累的想法是否足够清晰到可以开始 discuss-phase？」**

**判断标准（AI 自主评估）：**
- 能推断出明确的功能目标
- 至少一个 intent 为 `add` 或 `modify`
- 范围适合一个 phase

**若「不够清晰」：** 简洁说明原因，引导继续输入。

**若「足够」：** 立即执行 discuss-phase 工作流，不询问用户。
