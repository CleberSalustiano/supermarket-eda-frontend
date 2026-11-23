#!/usr/bin/env node
'use strict';

// Builds each web app in production mode with a valid sample environment and fails if any
// dev-only string (local URLs, demo ids, developer tools copy) appears in the output.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const forbiddenStrings = [
  'localhost:300',
  '8f6d7df2',
  '2b6b69a3',
  'Ferramentas de desenvolvimento',
  'Developer tools',
  'register-01'
];

const webApps = ['checkout-web', 'management-web', 'inventory-web'];

// Sample values deliberately differ from every development default.
const sampleEnvironment = {
  FRONTEND_TENANT_ID: '11111111-1111-4111-8111-111111111111',
  FRONTEND_CHECKOUT_API_BASE_URL: 'https://checkout.example.com',
  FRONTEND_INVENTORY_API_BASE_URL: 'https://inventory.example.com',
  FRONTEND_MANAGEMENT_API_BASE_URL: 'https://management.example.com',
  FRONTEND_DEFAULT_LOCALE: 'pt-BR'
};

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

/** Returns `{ file, forbidden }` for every file under `directory` that contains a forbidden string. */
function findForbiddenStrings(directory, forbidden = forbiddenStrings) {
  const findings = [];

  for (const file of listFiles(directory)) {
    const content = fs.readFileSync(file, 'utf8');

    for (const needle of forbidden) {
      if (content.includes(needle)) {
        findings.push({ file: path.relative(directory, file), forbidden: needle });
      }
    }
  }

  return findings;
}

function buildProduction(app, outDir) {
  const appDirectory = path.join(root, 'apps', app);
  const env = { ...process.env, ...sampleEnvironment, NODE_ENV: 'production' };
  // Keep the build independent of any developer .env.* file or shell override.
  delete env.FRONTEND_DEV_TOOLS;
  delete env.FRONTEND_CHECKOUT_REGISTER_ID;

  const result = spawnSync(
    path.join(root, 'node_modules', '.bin', 'vite'),
    ['build', '--mode', 'production', '--outDir', outDir, '--emptyOutDir'],
    { cwd: appDirectory, env, stdio: 'inherit' }
  );

  return result.status === 0;
}

function main() {
  const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-check-'));
  let failed = false;

  try {
    for (const app of webApps) {
      const outDir = path.join(workDirectory, app);

      if (!buildProduction(app, outDir)) {
        console.error(`FAIL ${app}: production build failed`);
        failed = true;
        continue;
      }

      const findings = findForbiddenStrings(outDir);

      if (findings.length === 0) {
        console.log(`PASS ${app}: no development-only strings in the production bundle`);
        continue;
      }

      failed = true;
      for (const finding of findings) {
        console.error(`FAIL ${app}: "${finding.forbidden}" found in ${finding.file}`);
      }
    }
  } finally {
    fs.rmSync(workDirectory, { recursive: true, force: true });
  }

  process.exit(failed ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { findForbiddenStrings, forbiddenStrings, sampleEnvironment };
