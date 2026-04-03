<purpose>
Quick find for existing solution docs. Single result output.
供系统内部自动调用，也支持用户手动执行。
</purpose>

<process>

## 1. 解析参数

从 $ARGUMENTS 提取查询关键词:
```bash
QUERY="{ARGUMENTS}"
CWD=$(pwd)
```

## 2. 查找 Solution Docs

```bash
node "$HOME/.claude/gsdt/bin/gsdt-tools.cjs" compound find "${QUERY}" \
  --project-dir "${CWD}"
```

## 3. 输出结果

**找到时**:
```
◆ Found solution

Title: {title}
Type: {problem_type}
Severity: {severity}
Path: {path}

Preview:
{preview}...

Solution Doc: {path}
```

**未找到时**:
```
◆ No solution found

Query: "{query}"

No existing solutions match this problem.
Run /gsdt:capture to document a new solution.
```

</process>
