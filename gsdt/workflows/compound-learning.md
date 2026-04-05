<purpose>
GSDT 内部 compound pipeline，专门处理 bug/fix 学习沉淀。

它不改变任何 `/gsdt:*` 入口，也不是用户手动跳转的 workflow。
统一由 `node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" compound dispatch ...` 触发。
</purpose>

<paths>
BASE_DIR={GSD_WS:-$PWD}
EVENTS_FILE=.gsdt-planning/compound-events.json
MEMORY_FILE=.gsdt-planning/compound-memory.json
ANTI_PATTERNS=.gsdt-planning/anti-patterns.md
DOCS_SOLUTIONS=docs/solutions
SCHEMA_REF=gsdt/references/compound-schema.yaml
YAML_SCHEMA_REF=gsdt/references/compound-yaml-schema.md
TEMPLATE_REF=gsdt/references/compound-resolution-template.md
</paths>

<process>

## Automatic Mode

这是后台 sidecar 流程。

- `diagnose-issues` / `debug` 发送 `diagnosed` 事件
- `verify-work` / `execute-phase` 发送 `compound candidate event`
- `post-commit` hook 根据提交信息启发式发送 `candidate` 或 `diagnosed` 事件
- 自动模式下不询问用户是否复用已有方案
- 高重叠文档直接更新
- 中度重叠创建新文档并记录 `related`
- 失败只写状态，不阻断父工作流

## Step 1: 接收结构化事件

入口统一是 `compound dispatch`:

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" compound dispatch \
  --event-file "$EVENT_FILE"
```

事件字段:

- `source`: `verify-work | diagnose-issues | debug | execute-phase | post-commit`
- `status`: `candidate | diagnosed | resolved`
- `problem`
- `symptoms[]`
- `root_cause`
- `severity`
- `files[]`
- `phase`
- `debug_session`
- `tags[]`
- `dedupe_key`

`post-commit` source 说明:

- 提交信息没有明确根因线索时，默认发 `candidate`
- 提交信息包含明显根因线索（如 `due to`、`caused by`、`missing`、`invalid` 等）时，可启发式升级为 `diagnosed`
- git hook 始终复用统一的 `compound dispatch` 管线，不走单独落盘逻辑

## Step 2: 调度与去重

`compound.cjs` 负责:

1. 规范化事件并写入 `.gsdt-planning/compound-events.json`
2. 用 `dedupe_key` 和 `problem_key` 合并重复事件
3. 将 `candidate` 升级为 `diagnosed`
4. 跳过已经 `compounded` 的重复事件

合并规则说明:

- 优先匹配相同 `dedupe_key`
- 若是候选事件升级，则按 `problem_key + phase` 合并
- 新事件信息更完整时覆盖旧事件字段

## Step 3: 查找已有方案

调度器先查 `docs/solutions/`:

- 目录优先: 先按 `problem_type -> category` 缩小范围
- frontmatter 优先: `title/tags/root_cause/problem_type`
- 全文兜底

自动模式规则:

- 高重叠: 更新原文档
- 中重叠: 新建文档并写 `related`
- 未命中: 创建新文档

## Step 4: 自动研究与单写口

`dispatch` 会先构造 fallback research，再尝试调用可用 CLI 丰富内容。

最终只有 `compound.cjs` 负责落盘:

- `processLearnings()` -> `docs/solutions/...`
- `writeToMemory()` -> `.gsdt-planning/compound-memory.json`
- `updateAntiPatterns()` -> `.gsdt-planning/anti-patterns.md`

## Step 5: 输出 JSON 结果

统一返回结构化结果:

```json
{
  "processed": true,
  "reason": "compounded",
  "solution_doc": "docs/solutions/logic-errors/example.md",
  "memory_id": "compound-123",
  "stats": {
    "created": 1,
    "updated": 0
  }
}
```

</process>

<success_criteria>
- [ ] 所有入口统一走 `compound dispatch`
- [ ] `candidate` 只记录事件，不直接写知识库
- [ ] `diagnosed` / `resolved` 自动沉淀到 `docs/solutions/`
- [ ] `.gsdt-planning/compound-memory.json` 与 `.gsdt-planning/anti-patterns.md` 由单写口维护
- [ ] 自动模式不询问用户
- [ ] compound 失败不阻断父工作流
</success_criteria>
