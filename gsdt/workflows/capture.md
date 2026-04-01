---
description: Fragment capture workflow — AI-driven entity extraction and graph inference
---

# Capture Workflow

You are executing `gsd:capture`. The user's raw fragment is in `<context>`.

## Step 0 — 项目状态检测

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs verify-path-exists "$(pwd)/.planning/ROADMAP.md"
```

- 存在 → 已初始化项目，跳至 Step 1（正常流程）
- 不存在 → 冷启动模式，跳至 Step 0b

---

## Step 0b — 冷启动：先保存碎片，再判断是否足够

先执行 Step 1-4 完成本次碎片的保存，然后继续：

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture graph
```

读取图谱统计，判断是否满足 new-project 触发条件：

**触发 new-project 的条件（需同时满足）：**
- `nodeCount >= 5` — 至少 5 个功能节点
- `edgeCount >= 2` — 至少 2 条关系边
- 碎片总数 >= 5

若不满足：显示当前 `nodeCount`、`edgeCount`、碎片总数，提示继续输入。停止。

若满足：继续 Step 0c。

---

## Step 0c — 自动创建 config.json（写死默认值，跳过配置问题）

```bash
mkdir -p .planning
node ~/.claude/gsdt/bin/gsdt-tools.cjs config-new-project \
  '{"mode":"yolo","granularity":"fine","parallelization":true,"commit_docs":true,"model_profile":"balanced","workflow":{"research":true,"plan_check":true,"verifier":true,"nyquist_validation":true,"auto_advance":true}}'

node ~/.claude/gsdt/bin/gsdt-tools.cjs commit "chore: add project config" --files .planning/config.json
node ~/.claude/gsdt/bin/gsdt-tools.cjs config-set workflow._auto_chain_active true
```

---

## Step 0d — 合并碎片，执行 new-project 后续步骤

将所有碎片原始文本合并为 idea document：
```
[片段1内容]
[片段2内容]
...
```

作为 AI，代入 `/gsdt:new-project --auto` 工作流的 Step 4 开始执行（已有 config.json，跳过 Step 2a）：

- **Step 4：** 从 idea document 生成 PROJECT.md（不询问用户，AI 自行推断缺失信息）
- **Step 6：** 并行启动 4 个研究 agent（STACK / FEATURES / ARCHITECTURE / PITFALLS）
- **Step 7：** 自动生成 REQUIREMENTS.md（auto-include 所有 table stakes）
- **Step 8：** 启动 gsdt-roadmapper 生成 ROADMAP.md（auto-approve）

任何信息 gap 由 AI research 填补，不询问用户。

---

## Step 0e — 自动进入 discuss-phase 1

new-project 完成后，立即使用 Skill 工具调用 discuss-phase：

```
Skill(skill="gsd:discuss-phase", args="1 --auto")
```

这会触发 discuss-phase 的 `auto_advance` 步骤，在完成后自动进入 `plan-phase`。

---

## Step 1 — Validate input

If `<context>` is empty or missing, respond:
```
请提供碎片内容，例如：/gsdt:capture 我想做一个 X 功能
```
Then stop.

## Step 2 — Read existing graph

Run:
```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture graph
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
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture save \
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

## Step 6 — 触发判断（仅已初始化项目）

读取图谱统计：
```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture graph
```

**触发 discuss-phase 的条件（需同时满足）：**
- `nodeCount >= 3` — 至少 3 个功能节点
- `edgeCount >= 1` 或 `multiEvidenceCount >= 1` — 至少 1 条边或有节点被多个碎片引用
- 碎片总数 >= 3

**判断流程：**
1. 读取图谱统计和碎片内容
2. 检查是否满足上述条件
3. 若满足 → 调用 discuss-phase
4. 若不满足 → 显示当前统计，提示继续输入

**若不满足：** 显示 `nodeCount`、`edgeCount`、碎片总数，说明还需要哪些条件。停止。

**若满足：** 立即使用 Skill 工具调用 discuss-phase：

```
Skill(skill="gsd:discuss-phase", args="<phase_number> --auto")
```

这会触发 discuss-phase 的 `auto_advance` 步骤，在完成后自动进入 `plan-phase`。
