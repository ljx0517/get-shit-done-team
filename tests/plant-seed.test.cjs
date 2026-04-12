const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('plant-seed workflow ignore propagation', () => {
  test('workflow reads merged map_ignore rules before breadcrumb search', () => {
    const workflow = fs.readFileSync(
      path.join(__dirname, '..', 'gsdt', 'workflows', 'plant-seed.md'),
      'utf8'
    );

    assert.ok(
      workflow.includes('init milestone-op') && workflow.includes('<map_ignore>'),
      'plant-seed workflow should initialize and prepare map_ignore rules'
    );
    assert.ok(
      workflow.includes('ignored paths') || workflow.includes('filter out ignored paths'),
      'plant-seed workflow should honor ignore rules during breadcrumb search'
    );
  });
});
