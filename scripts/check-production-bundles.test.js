'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { findForbiddenStrings, forbiddenStrings, sampleEnvironment } = require('./check-production-bundles');

test('findForbiddenStrings reports files containing dev-only strings, including nested ones', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-scan-'));
  fs.mkdirSync(path.join(directory, 'assets'));
  fs.writeFileSync(path.join(directory, 'assets', 'index.js'), 'fetch("http://localhost:3001")');
  fs.writeFileSync(path.join(directory, 'index.html'), '<html></html>');

  assert.deepEqual(findForbiddenStrings(directory), [
    { file: path.join('assets', 'index.js'), forbidden: 'localhost:300' }
  ]);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('the sample environment never contains a forbidden string', () => {
  const sample = JSON.stringify(sampleEnvironment);

  for (const needle of forbiddenStrings) {
    assert.equal(sample.includes(needle), false, needle);
  }
});
