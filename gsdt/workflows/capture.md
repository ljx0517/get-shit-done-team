---
description: Fragment capture workflow — AI-driven entity extraction and graph inference
---

# Capture Workflow

You are executing `gsd:capture`. The user's raw fragment is in `<context>`.

## Step 0 — 项目状态检测

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs verify-path-exists "$(pwd)/.gsdt-planning/ROADMAP.md"
```

- 存在 → 已初始化项目，跳至 Step 1（正常流程）
- 不存在 → 冷启动模式，跳至 Step 0b

**硬门禁规则（必须遵守）：**
- `ROADMAP.md` 不存在时，**禁止**直接调用 `discuss-phase`
- 冷启动只允许两种结果：继续收集碎片，或自动触发 `new-project`
- 只有 `new-project` 成功生成 `ROADMAP.md` 后，才允许自动进入 `discuss-phase`

---

## Step 0b — 冷启动：先保存碎片，再判断是否足够

先执行 Step 1-4 完成本次碎片的保存，然后继续：

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture decide
```

`capture decide` 作为唯一判定源，返回 `decision.next_action`：
- `collect_more` — 继续收集
- `trigger_new_project` — 自动触发初始化

判定采用双通道（防卡死）：
- 语义通道：`nodeCount>=5 && edgeCount>=2 && (crossFragmentSimilarity>=0.15 || multiEvidenceCount>=1)`
- 结构通道：`fragmentCount>=4 && nodeCount>=12 && edgeCount>=10 && connectedNodeRatio>=0.75`

若 `next_action=collect_more`：显示一行状态并停止：
`收集中 | next=collect_more`

若 `next_action=trigger_new_project`：继续 Step 0c。

---

## Step 0c — 自动创建 config.json（写死默认值，跳过配置问题）

```bash
mkdir -p .gsdt-planning
node ~/.claude/gsdt/bin/gsdt-tools.cjs config-new-project \
  '{"mode":"yolo","granularity":"fine","parallelization":true,"commit_docs":true,"model_profile":"balanced","workflow":{"research":true,"plan_check":true,"verifier":true,"nyquist_validation":true,"auto_advance":true}}'

node ~/.claude/gsdt/bin/gsdt-tools.cjs commit "chore: add project config" --files .gsdt-planning/config.json
node ~/.claude/gsdt/bin/gsdt-tools.cjs config-set workflow._auto_chain_active true
```

---

## Step 0d — 合并碎片并自动触发 new-project

将所有碎片原始文本合并为 idea document：
```
[片段1内容]
[片段2内容]
...
```

将合并后的内容写入：
`.gsdt-planning/captures/idea.md`

然后**必须**直接触发：
```
Skill(skill="gsdt:new-project", args="--auto @.gsdt-planning/captures/idea.md")
```

失败自愈（自动重试）：
- 同一步最多重试 3 次（2s, 4s, 8s）
- 3 次仍失败：仅输出一行状态并停止
  `初始化中 | next=blocked (new-project failed after 3 retries)`

任何信息 gap 由 AI research 填补，不询问用户。

---

## Step 0e — 自动进入 discuss-phase 1

new-project 返回后，先验证 ROADMAP 是否已生成：

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs verify-path-exists "$(pwd)/.gsdt-planning/ROADMAP.md"
```

- 若不存在：报告 `new-project 未完成或失败`，停止（禁止进入 discuss-phase）
- 若存在：立即进入 discuss-phase

调用：

```
Skill(skill="gsdt:discuss-phase", args="1 --auto")
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

## Step 3 — Intent splitting

Given the fragment text, determine if it contains **multiple independent intents**.

**Core principle**: Judge purely by the input text itself. Do NOT reference project context (e.g., "this is a multi-agent project"). The user's original words are the only source of truth.

### Split test

Apply the **independent-demand test** to each candidate split:

1. Can the candidate block form a complete, standalone demand on its own?
2. If you remove this block, does the remaining text still constitute a valid, meaningful user demand?

If both answers are **yes** for multiple blocks → split them.

### Practical split signals

- User explicitly separates ideas with "而且"、"并且"、"还有"、"另外"
- Each block can be prefixed with "我想要..." and still make sense
- One block answers "what to build", another answers a different "what to build" (not a sub-step of the first)
- Removing one block leaves a complete thought with no dangling reference from the removed part

### Practical merge signals

- Each block refers back to something in the other block ("需要X来实现Y" — Y is incomplete without X)
- They describe a single user's single workflow step-by-step
- They share the same subject noun and one only makes sense as a modifier of the other
- The intent is a single feature with multiple facets, none of which stand alone

### Split result

If multiple intents detected, split into separate fragments. For each independent intent `i`:
- `text_i` — the exact text snippet for this intent (preserve original wording)
- `intent_i` — the intent of this specific fragment
- `entities_i` — entities belonging to this intent only (no cross-fragment sharing)
- `nodes_i` — new nodes for this intent only
- `edges_i` — edges connecting nodes within this intent only

If single intent: proceed with the full text as one fragment.

**Important**: Split conservatively. If in doubt, prefer fewer fragments — you can always add more later, but merging incorrectly distorts the graph.

## Step 4 — Save fragments

For each split fragment (or the single fragment), run the save command:

```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture save \
  --text "<FRAGMENT_TEXT>" \
  --intent "<intent>" \
  --entities "<e1,e2,...>" \
  --nodes "<new_node1,new_node2,...>" \
  --edges "<src1:dst1,src2:dst2,...>"
```

If entities/nodes/edges are empty, pass empty string `""`.

Run the save command **once per fragment**. If 3 intents were split, run 3 save commands sequentially.

## Step 5 — Present results

Parse each save command output and display:

For each fragment captured:
```
碎片已捕获: <fragment_id>
意图: <intent>
实体: <entities or "未识别">
新增节点: <new_nodes or "无">
新增关系: <new_edges or "无"
```

After all fragments:
```
---（分隔线）
图谱状态: <total_nodeCount> 节点 / <total_edgeCount> 边 / <total_fragment_count> 碎片
```

**注意**：如果输入被拆分为多个碎片，显示顺序按 intent 优先级排列（add > modify > unknown）。

**碎片进度仅作参考，不等同于 milestone 进度。**
Milestone 形成的前提是 nodeCount >= 3（至少 3 个功能节点），而非碎片数量。

## Step 6 — 触发判断（仅已初始化项目）

**前置硬校验（必须先做）：**
```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs verify-path-exists "$(pwd)/.gsdt-planning/ROADMAP.md"
```

如果 `ROADMAP.md` 不存在：说明仍处于冷启动路径。**禁止**执行 discuss-phase，返回 Step 0b 逻辑（继续收集或触发 new-project）。

读取确定性判定：
```bash
node ~/.claude/gsdt/bin/gsdt-tools.cjs capture decide
```

若 `decision.next_action=collect_more`：
- 仅输出一行状态并停止：`收集中 | next=collect_more`

若 `decision.next_action=trigger_discuss_phase`：立即使用 Skill 工具调用 discuss-phase：

```
Skill(skill="gsdt:discuss-phase", args="<phase_number> --auto")
```

调用前输出一行状态：`规划中 | next=trigger_discuss_phase`
这会触发 discuss-phase 的 `auto_advance` 步骤，在完成后自动进入 `plan-phase`。
