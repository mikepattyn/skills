import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  classifyStem,
  discoverScriptStems,
  groupScriptStems,
  isNodeWrapperText,
  isSkippedStem,
  posixStemFromScript,
  stemId,
} from './script-stems.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const genericSh = `#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
BASE="$(basename "$0" .sh)"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to run \${BASE}" >&2
  exit 1
fi

exec node "$DIR/$BASE.mjs" "$@"
`;

const genericPs1 = `#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

$Base = [System.IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)
$Script = Join-Path $PSScriptRoot "$Base.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node is required to run $Base"
    exit 1
}

& node $Script @args
exit $LASTEXITCODE
`;

describe('isNodeWrapperText', () => {
  it('accepts the generic bash wrapper template', () => {
    assert.equal(isNodeWrapperText(genericSh, 'build-lambda'), true);
  });

  it('accepts the generic PowerShell wrapper template', () => {
    assert.equal(isNodeWrapperText(genericPs1, 'build-lambda'), true);
  });

  it('accepts the repo wrapper templates', () => {
    const templates = join(here, '..', '.cursor', 'skills', 'scripts-to-node', 'templates');
    const sh = readFileSync(join(templates, 'wrapper.sh'), 'utf8');
    const ps1 = readFileSync(join(templates, 'wrapper.ps1'), 'utf8');
    assert.equal(isNodeWrapperText(sh, 'build-lambda'), true);
    assert.equal(isNodeWrapperText(ps1, 'build-lambda'), true);
  });

  it('accepts scripts/app-fanout.sh', () => {
    const text = readFileSync(join(here, 'app-fanout.sh'), 'utf8');
    assert.equal(isNodeWrapperText(text, 'app-fanout'), true);
  });

  it('accepts converted scripts/build-lambda.sh', () => {
    const text = readFileSync(join(here, 'build-lambda.sh'), 'utf8');
    assert.equal(isNodeWrapperText(text, 'build-lambda'), true);
  });

  it('rejects an empty or node-less file', () => {
    assert.equal(isNodeWrapperText('', 'foo'), false);
    assert.equal(isNodeWrapperText('echo hi\n', 'foo'), false);
  });
});

describe('stems', () => {
  it('strips .sh / .ps1 and slugs ids', () => {
    assert.equal(posixStemFromScript('scripts/build-lambda.sh'), 'scripts/build-lambda');
    assert.equal(
      posixStemFromScript('apps\\kapsalon\\scripts\\test-backend.ps1'),
      'apps/kapsalon/scripts/test-backend',
    );
    assert.equal(stemId('scripts/build-lambda'), 'scripts-build-lambda');
    assert.equal(
      stemId('apps/kapsalon/scripts/test-backend'),
      'apps-kapsalon-scripts-test-backend',
    );
  });

  it('groups a pair and an unpaired shell', () => {
    const grouped = groupScriptStems(['scripts/foo.sh', 'scripts/foo.ps1', 'scripts/bar.sh']);
    assert.deepEqual(grouped, [
      { stem: 'scripts/bar', sh: 'scripts/bar.sh', ps1: null },
      { stem: 'scripts/foo', sh: 'scripts/foo.sh', ps1: 'scripts/foo.ps1' },
    ]);
  });

  it('skips gitlink prefixes and node_modules', () => {
    assert.equal(isSkippedStem('apps/canvas/tools/x', ['apps/canvas']), true);
    assert.equal(isSkippedStem('scripts/build-lambda', ['apps/canvas']), false);
    assert.equal(isSkippedStem('apps/foo/node_modules/x'), true);
    assert.equal(isSkippedStem('.cursor/skills/scripts-to-node/templates/wrapper'), true);
  });
});

describe('classifyStem', () => {
  const files = {
    'scripts/app-fanout.sh': genericSh,
    'scripts/app-fanout.ps1': genericPs1,
    'scripts/app-fanout.mjs': 'export {}\n',
    'scripts/native.sh': 'dotnet test\n',
    'scripts/native.ps1': 'dotnet test\n',
  };
  const exists = (p) => p in files || p === 'scripts/app-fanout.mjs';
  const read = (p) => files[p] ?? '';

  it('marks a complete wrapper trio as converted', () => {
    const result = classifyStem(
      { stem: 'scripts/app-fanout', sh: 'scripts/app-fanout.sh', ps1: 'scripts/app-fanout.ps1' },
      { exists, read },
    );
    assert.equal(result.converted, true);
    assert.equal(result.reason, 'already-node');
  });

  it('marks native paired shells as missing-mjs', () => {
    const result = classifyStem(
      { stem: 'scripts/native', sh: 'scripts/native.sh', ps1: 'scripts/native.ps1' },
      { exists: (p) => p in files && !p.endsWith('.mjs'), read },
    );
    assert.equal(result.converted, false);
    assert.equal(result.reason, 'missing-mjs');
  });

  it('marks an mjs with a native shell as shell-not-wrapper', () => {
    const disk = {
      ...files,
      'scripts/mixed.sh': 'aws s3 sync a b\n',
      'scripts/mixed.ps1': genericPs1,
      'scripts/mixed.mjs': 'export {}\n',
    };
    const result = classifyStem(
      { stem: 'scripts/mixed', sh: 'scripts/mixed.sh', ps1: 'scripts/mixed.ps1' },
      { exists: (p) => p in disk, read: (p) => disk[p] },
    );
    assert.equal(result.converted, false);
    assert.equal(result.reason, 'shell-not-wrapper');
  });
});

describe('discoverScriptStems', () => {
  it('emits one row per stem and skips gitlinks', () => {
    const disk = {
      'scripts/app-fanout.sh': genericSh,
      'scripts/app-fanout.ps1': genericPs1,
      'scripts/app-fanout.mjs': 'export {}\n',
      'scripts/native.sh': 'echo native\n',
      'apps/canvas/tools/x.sh': genericSh,
      '.cursor/skills/scripts-to-node/templates/wrapper.sh': genericSh,
      '.cursor/skills/scripts-to-node/templates/wrapper.ps1': genericPs1,
    };
    const apps = discoverScriptStems({
      gitFiles: Object.keys(disk).filter((p) => p.endsWith('.sh') || p.endsWith('.ps1')),
      exists: (p) => p in disk,
      read: (p) => disk[p],
      gitlinkPrefixes: ['apps/canvas'],
    });
    const ids = apps.map((a) => a.id);
    assert.deepEqual(ids, ['scripts-app-fanout', 'scripts-native']);
    assert.equal(
      ids.includes('.cursor-skills-scripts-to-node-templates-wrapper') ||
        ids.includes('cursor-skills-scripts-to-node-templates-wrapper'),
      false,
    );
    const converted = apps.find((a) => a.id === 'scripts-app-fanout');
    const native = apps.find((a) => a.id === 'scripts-native');
    assert.equal(converted.converted, true);
    assert.equal(converted.kind, 'script');
    assert.equal(converted.stem, 'scripts/app-fanout');
    assert.equal(native.converted, false);
    assert.equal(native.convertReason, 'missing-mjs');
    assert.equal(native.scriptFiles.mjs, 'scripts/native.mjs');
  });
});
