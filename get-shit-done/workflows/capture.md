---
description: Fragment capture workflow — AI-driven entity extraction and graph inference
---

# Capture Workflow

You are executing `gsd:capture`. The user's raw fragment is in `<context>`.

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
<message>
```

## Step 6 — Milestone auto-trigger

If `trigger.ready` is `true`, immediately run without asking:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.cjs discuss-phase
```

Then continue executing the discuss-phase workflow as normal.

Otherwise, briefly note how far from the threshold (nodes/edges still needed).
