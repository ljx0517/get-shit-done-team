/**
 * GSD Tools Tests - Compound schema and document generation
 */
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  researchToDoc,
  processLearnings,
  parseFrontmatter,
  normalizeCompoundEvent,
} = require('../gsdt/bin/lib/review/compound.cjs');

function createTempProject(prefix = 'gsdt-compound-schema-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.mkdirSync(path.join(tmpDir, '.gsdt-planning'), { recursive: true });
  return tmpDir;
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

describe('compound reference files', () => {
  test('reference contract files exist', () => {
    const referencesDir = path.join(__dirname, '..', 'gsdt', 'references');
    assert.ok(
      fs.existsSync(path.join(referencesDir, 'compound-schema.yaml')),
      'compound-schema.yaml should exist'
    );
    assert.ok(
      fs.existsSync(path.join(referencesDir, 'compound-yaml-schema.md')),
      'compound-yaml-schema.md should exist'
    );
    assert.ok(
      fs.existsSync(path.join(referencesDir, 'compound-resolution-template.md')),
      'compound-resolution-template.md should exist'
    );
  });
});

describe('normalizeCompoundEvent', () => {
  test('normalizes workflow severities and computes a dedupe key', () => {
    const event = normalizeCompoundEvent({
      source: 'diagnose-issues',
      status: 'diagnosed',
      problem: 'N+1 query on comments page',
      root_cause: 'Missing include on comments query',
      severity: 'major',
      tags: ['uat', 'comments'],
    });

    assert.strictEqual(event.severity, 'P1');
    assert.strictEqual(event.problem_type, 'performance_issue');
    assert.ok(event.dedupe_key.includes('performance-issue'));
    assert.ok(event.tags.includes('uat'));
  });
});

describe('researchToDoc', () => {
  test('maps bug-track research into structured frontmatter', () => {
    const result = researchToDoc({
      title: 'Comment list N+1 query',
      problem: 'Loading comments triggers repeated queries.',
      problem_type: 'performance_issue',
      severity: 'P1',
      root_cause: 'missing_include',
      tags: ['comments', 'n-plus-one'],
      source: 'diagnose-issues',
      phase: '04',
      files: ['src/comments.ts'],
    });

    assert.strictEqual(result.categoryKey, 'performance-issues');
    assert.strictEqual(result.frontmatter.track, 'bug');
    assert.strictEqual(result.frontmatter.problem_type, 'performance_issue');
    assert.strictEqual(result.frontmatter.severity, 'high');
    assert.strictEqual(result.frontmatter.source, 'diagnose-issues');
    assert.strictEqual(result.frontmatter.phase, '04');
    assert.deepStrictEqual(result.frontmatter.files, ['src/comments.ts']);
  });
});

describe('processLearnings', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('writes solution docs into the expected category directory', async () => {
    const result = await processLearnings(tmpDir, [
      {
        title: 'Comment list N+1 query',
        problem: 'Loading comments triggers repeated queries.',
        problem_type: 'performance_issue',
        severity: 'P1',
        confidence: 0.9,
        root_cause: 'missing_include',
        solution: 'Use eager loading for comments and authors.',
        prevention: '- Add query count assertions',
        tags: ['comments', 'n-plus-one'],
        source: 'diagnose-issues',
        phase: '04',
        files: ['src/comments.ts'],
      },
    ]);

    assert.strictEqual(result.stats.created, 1);
    const createdDoc = result.docs[0].path;
    assert.ok(createdDoc.includes(path.join('docs', 'solutions', 'performance-issues')));

    const content = fs.readFileSync(createdDoc, 'utf8');
    const frontmatter = parseFrontmatter(content);
    assert.strictEqual(frontmatter.problem_type, 'performance_issue');
    assert.strictEqual(frontmatter.source, 'diagnose-issues');
  });

  test('updates an existing solution doc when overlap is high', async () => {
    const docsDir = path.join(tmpDir, 'docs', 'solutions', 'performance-issues');
    fs.mkdirSync(docsDir, { recursive: true });
    const existingDoc = path.join(docsDir, 'comment-list-n-plus-one-2026-04-02.md');
    fs.writeFileSync(
      existingDoc,
      `---
title: Comment list N+1 query
date: 2026-04-02
problem_type: performance_issue
severity: high
track: bug
root_cause: missing_include
tags: ['comments']
source: diagnose-issues
---

## Problem

Old content.
`
    );

    const result = await processLearnings(tmpDir, [
      {
        title: 'Comment list N+1 query persists',
        problem: 'Loading comments still triggers repeated queries.',
        problem_type: 'performance_issue',
        severity: 'P1',
        confidence: 0.9,
        root_cause: 'missing_include',
        solution: 'Use eager loading for comments and authors.',
        prevention: '- Add query count assertions',
        tags: ['comments', 'n-plus-one'],
        source: 'debug',
        phase: '04',
        files: ['src/comments.ts'],
      },
    ]);

    assert.strictEqual(result.stats.updated, 1);
    assert.strictEqual(result.docs[0].path, existingDoc);

    const updatedContent = fs.readFileSync(existingDoc, 'utf8');
    assert.ok(updatedContent.includes('Use eager loading for comments and authors.'));
    const updatedFrontmatter = parseFrontmatter(updatedContent);
    assert.strictEqual(updatedFrontmatter.date, '2026-04-02');
    assert.strictEqual(updatedFrontmatter.title, 'Comment list N+1 query');
  });
});
