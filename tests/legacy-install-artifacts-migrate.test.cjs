/**
 * Legacy gsd-* manifest / patch / pristine paths → gsdt-* migration
 */

process.env.GSD_TEST_MODE = '1';

const { test, describe, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  migrateLegacyInstallArtifacts,
  MANIFEST_NAME,
  LEGACY_MANIFEST_NAME,
  PATCHES_DIR_NAME,
  LEGACY_PATCHES_DIR_NAME,
  PRISTINE_DIR_NAME,
  LEGACY_PRISTINE_DIR_NAME,
} = require('../bin/install.js');

describe('migrateLegacyInstallArtifacts', () => {
  let tmp;

  afterEach(() => {
    if (tmp) {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    tmp = undefined;
  });

  test('migrates legacy manifest when new missing', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdt-mig-'));
    const oldPath = path.join(tmp, LEGACY_MANIFEST_NAME);
    fs.writeFileSync(oldPath, '{"version":"0.0.1","files":{}}', 'utf8');
    migrateLegacyInstallArtifacts(tmp);
    const newPath = path.join(tmp, MANIFEST_NAME);
    assert.ok(fs.existsSync(newPath), 'new manifest exists');
    assert.ok(!fs.existsSync(oldPath), 'old manifest removed');
  });

  test('does not overwrite when both manifests exist', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdt-mig-'));
    const newPath = path.join(tmp, MANIFEST_NAME);
    const oldPath = path.join(tmp, LEGACY_MANIFEST_NAME);
    fs.writeFileSync(newPath, '{"version":"new"}', 'utf8');
    fs.writeFileSync(oldPath, '{"version":"old"}', 'utf8');
    migrateLegacyInstallArtifacts(tmp);
    assert.ok(fs.existsSync(newPath), 'new still exists');
    assert.ok(fs.existsSync(oldPath), 'old kept when both present');
    assert.ok(fs.readFileSync(newPath, 'utf8').includes('new'), 'new content unchanged');
  });

  test('migrates legacy patches directory when new missing', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdt-mig-'));
    const oldDir = path.join(tmp, LEGACY_PATCHES_DIR_NAME);
    fs.mkdirSync(oldDir, { recursive: true });
    fs.writeFileSync(path.join(oldDir, 'backup-meta.json'), '{}', 'utf8');
    migrateLegacyInstallArtifacts(tmp);
    const newDir = path.join(tmp, PATCHES_DIR_NAME);
    assert.ok(fs.existsSync(path.join(newDir, 'backup-meta.json')), 'file moved');
    assert.ok(!fs.existsSync(oldDir), 'old dir removed');
  });

  test('migrates legacy pristine directory when new missing', () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gsdt-mig-'));
    const oldDir = path.join(tmp, LEGACY_PRISTINE_DIR_NAME);
    fs.mkdirSync(oldDir, { recursive: true });
    fs.writeFileSync(path.join(oldDir, 'x.txt'), 'p', 'utf8');
    migrateLegacyInstallArtifacts(tmp);
    const newDir = path.join(tmp, PRISTINE_DIR_NAME);
    assert.strictEqual(fs.readFileSync(path.join(newDir, 'x.txt'), 'utf8'), 'p');
    assert.ok(!fs.existsSync(oldDir));
  });
});
