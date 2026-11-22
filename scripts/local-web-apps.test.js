'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { parseArgs, resolveApps, formatJsonSummary } = require('./local-web-apps');

test('parseArgs accepts every flag combination', () => {
  assert.deepEqual(parseArgs(['start']), { command: 'start', withMobile: false, json: false });
  assert.deepEqual(parseArgs(['start', '--json']), { command: 'start', withMobile: false, json: true });
  assert.deepEqual(parseArgs(['start', '--with-mobile']), { command: 'start', withMobile: true, json: false });
  assert.deepEqual(parseArgs(['start', '--with-mobile', '--json']), {
    command: 'start',
    withMobile: true,
    json: true,
  });
  assert.equal(parseArgs(['stop']).command, 'stop');
  assert.equal(parseArgs(['status']).command, 'status');
});

test('parseArgs rejects unknown commands and flags', () => {
  assert.throws(() => parseArgs(['restart']), /Unknown command: restart/);
  assert.throws(() => parseArgs([]), /Unknown command/);
  assert.throws(() => parseArgs(['start', '--bogus']), /Unknown flag: --bogus/);
});

test('resolveApps returns the three web apps without mobile', () => {
  const apps = resolveApps({ withMobile: false });
  assert.deepEqual(
    apps.map(({ name, workspace, url }) => ({ name, workspace, url })),
    [
      { name: 'management-web', workspace: '@supermarket/management-web', url: 'http://localhost:4100' },
      { name: 'checkout-web', workspace: '@supermarket/checkout-web', url: 'http://localhost:4101' },
      { name: 'inventory-web', workspace: '@supermarket/inventory-web', url: 'http://localhost:4102' },
    ],
  );
});

test('resolveApps appends the mobile app with CI=1', () => {
  const apps = resolveApps({ withMobile: true });
  assert.equal(apps.length, 4);
  const mobile = apps[3];
  assert.equal(mobile.name, 'operations-mobile');
  assert.equal(mobile.workspace, '@supermarket/operations-mobile');
  assert.equal(mobile.url, 'http://localhost:8081');
  assert.deepEqual(mobile.env, { CI: '1' });
});

test('formatJsonSummary emits the contract shape on a single line', () => {
  const output = formatJsonSummary([
    {
      name: 'checkout-web',
      url: 'http://localhost:4101',
      pid: 123,
      status: 'running',
      log: '/abs/checkout-web.log',
      workspace: 'ignored',
    },
  ]);
  assert.ok(!output.includes('\n'));
  assert.deepEqual(JSON.parse(output), {
    apps: [
      {
        name: 'checkout-web',
        url: 'http://localhost:4101',
        pid: 123,
        status: 'running',
        log: '/abs/checkout-web.log',
      },
    ],
  });
});
