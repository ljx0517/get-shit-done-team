# Compound Resolution Template

Use this structure for auto-generated bug learnings.

```markdown
---
title: Example failure pattern
date: 2026-04-02
problem_type: logic_error
severity: high
track: bug
source: diagnose-issues
phase: 04
files:
  - src/example.ts
tags:
  - auto-compound
  - diagnose-issues
dedupe_key: logic-error--example-failure-pattern--missing-guard
symptoms:
  - User action appears to succeed but state does not refresh
root_cause: Missing state invalidation after mutation
resolution_type: code_fix
---

## Context

- Source: diagnose-issues
- Phase: 04
- File: src/example.ts

## Problem

Describe the failure in concrete workflow terms.

## Symptoms

- Symptom one
- Symptom two

## Root Cause

State the diagnosed cause in a way that will match future searches.

## Solution

Describe the corrective action in a way another engineer can repeat.

## Why This Works

Explain why the fix addresses the root cause.

## Prevention

- Add a regression test
- Re-run the originating workflow before shipping

## Examples

Optional file references or reproduction hints.
```
