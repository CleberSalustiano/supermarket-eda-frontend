#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const RUN_DIR = path.join(ROOT_DIR, '.local-run');
const LOG_DIR = path.join(RUN_DIR, 'logs');
const PID_DIR = path.join(RUN_DIR, 'pids');

const START_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;
const STOP_TIMEOUT_MS = 10_000;
const LOG_TAIL_LINES = 30;

const WEB_APPS = [
  { name: 'management-web', workspace: '@supermarket/management-web', url: 'http://localhost:4100' },
  { name: 'checkout-web', workspace: '@supermarket/checkout-web', url: 'http://localhost:4101' },
  { name: 'inventory-web', workspace: '@supermarket/inventory-web', url: 'http://localhost:4102' },
];

const MOBILE_APP = {
  name: 'operations-mobile',
  workspace: '@supermarket/operations-mobile',
  url: 'http://localhost:8081',
  env: { CI: '1' },
};

const COMMANDS = ['start', 'stop', 'status'];

function parseArgs(argv) {
  const [command, ...flags] = argv;
  if (!COMMANDS.includes(command)) {
    throw new Error(`Unknown command: ${command ?? '(none)'}. Use one of: ${COMMANDS.join(', ')}`);
  }
  const options = { command, withMobile: false, json: false };
  for (const flag of flags) {
    if (flag === '--with-mobile') {
      options.withMobile = true;
    } else if (flag === '--json') {
      options.json = true;
    } else {
      throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return options;
}

function resolveApps({ withMobile }) {
  return withMobile ? [...WEB_APPS, MOBILE_APP] : [...WEB_APPS];
}

function formatJsonSummary(results) {
  return JSON.stringify({
    apps: results.map(({ name, url, pid, status, log }) => ({ name, url, pid, status, log })),
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pidFilePath = (app) => path.join(PID_DIR, `${app.name}.pid`);
const logFilePath = (app) => path.join(LOG_DIR, `${app.name}.log`);

function readPid(app) {
  try {
    const pid = Number.parseInt(fs.readFileSync(pidFilePath(app), 'utf8').trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isAlive(pid) {
  if (pid === null) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

async function isUrlUp(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function waitForUrl(url, timeoutMs, isStillRunning) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUrlUp(url)) {
      return true;
    }
    if (!isStillRunning()) {
      return false;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return false;
}

function tailLog(app) {
  try {
    return fs.readFileSync(logFilePath(app), 'utf8').split('\n').slice(-LOG_TAIL_LINES - 1).join('\n');
  } catch {
    return '(no log available)';
  }
}

function spawnApp(app) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(PID_DIR, { recursive: true });
  const logFd = fs.openSync(logFilePath(app), 'a');
  const child = spawn('npm', ['run', 'dev', '--workspace', app.workspace], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, ...(app.env ?? {}) },
  });
  fs.closeSync(logFd);
  fs.writeFileSync(pidFilePath(app), String(child.pid));
  child.unref();
  return child.pid;
}

async function startApp(app) {
  const existingPid = readPid(app);
  if (isAlive(existingPid) && (await isUrlUp(app.url))) {
    return { ...app, pid: existingPid, status: 'running', log: logFilePath(app) };
  }
  if (isAlive(existingPid)) {
    await stopApp(app);
  }

  const pid = spawnApp(app);
  const up = await waitForUrl(app.url, START_TIMEOUT_MS, () => isAlive(pid));
  return { ...app, pid, status: up ? 'running' : 'failed', log: logFilePath(app) };
}

async function stopApp(app) {
  const pid = readPid(app);
  if (isAlive(pid)) {
    signalGroup(pid, 'SIGTERM');
    const deadline = Date.now() + STOP_TIMEOUT_MS;
    while (isAlive(pid) && Date.now() < deadline) {
      await sleep(200);
    }
    if (isAlive(pid)) {
      signalGroup(pid, 'SIGKILL');
    }
  }
  fs.rmSync(pidFilePath(app), { force: true });
  return pid;
}

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch {
    // The group is already gone or was never a group leader; fall back to the process itself.
    try {
      process.kill(pid, signal);
    } catch {
      // Stale pid, nothing to stop.
    }
  }
}

async function runStart(options) {
  const results = [];
  for (const app of resolveApps(options)) {
    const result = await startApp(app);
    results.push(result);
    if (!options.json || result.status === 'failed') {
      const line = `${result.name} ${result.status} ${result.url} (pid ${result.pid}, log ${result.log})`;
      (result.status === 'failed' ? console.error : console.log)(line);
    }
    if (result.status === 'failed') {
      console.error(`Last ${LOG_TAIL_LINES} lines of ${result.log}:\n${tailLog(app)}`);
    }
  }
  if (options.json) {
    console.log(formatJsonSummary(results));
  }
  return results.every((result) => result.status === 'running') ? 0 : 1;
}

async function runStop() {
  for (const app of resolveApps({ withMobile: true })) {
    const pid = await stopApp(app);
    console.log(pid === null ? `${app.name} not running` : `${app.name} stopped (pid ${pid})`);
  }
  return 0;
}

async function runStatus() {
  for (const app of resolveApps({ withMobile: true })) {
    const pid = readPid(app);
    const urlStatus = (await isUrlUp(app.url)) ? 'up' : 'down';
    console.log(`${app.name} pid=${pid ?? '-'} alive=${isAlive(pid)} url=${app.url} ${urlStatus}`);
  }
  return 0;
}

async function main(argv) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  const handlers = { start: runStart, stop: runStop, status: runStatus };
  return handlers[options.command](options);
}

module.exports = { parseArgs, resolveApps, formatJsonSummary };

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
