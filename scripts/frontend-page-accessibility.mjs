#!/usr/bin/env node
/**
 * Compatibility shim. Planning lives in scripts/app-fanout.mjs
 * with --skill frontend-page-accessibility.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  [
    join(scriptDir, 'app-fanout.mjs'),
    '--skill',
    'frontend-page-accessibility',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
