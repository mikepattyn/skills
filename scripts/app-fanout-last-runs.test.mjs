import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';
import {
  commitLastRunsIfNeeded,
  lastRunsCommitMessage,
  lastRunsNeedCommit,
} from './app-fanout-last-runs.mjs';

const REL = '.cursor/skills/frontend-format/last-runs.json';
const temps = [];

function gitIn(dir, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFail) return '';
    const detail = err.stderr?.toString().trim() || err.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function tempRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'fanout-last-runs-'));
  temps.push(dir);
  gitIn(dir, ['init']);
  gitIn(dir, ['config', 'user.email', 'fanout-test@example.com']);
  gitIn(dir, ['config', 'user.name', 'Fanout Test']);
  writeFileSync(join(dir, 'README'), 'init\n');
  gitIn(dir, ['add', '--', 'README']);
  gitIn(dir, ['commit', '-m', 'init']);
  return dir;
}

function writeLastRuns(dir, apps) {
  const dest = join(dir, ...REL.split('/'));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify({ version: 1, apps }, null, 2)}\n`);
}

after(() => {
  for (const dir of temps) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('lastRunsNeedCommit', () => {
  it('is true when an id is recorded for the first time', () => {
    assert.equal(
      lastRunsNeedCommit(
        {},
        { kapsalon: { lastCommit: 'aaa', recordedAt: '2026-08-22T00:00:00.000Z' } },
        ['kapsalon'],
      ),
      true,
    );
  });

  it('is true when recordedAt changes', () => {
    const before = { kapsalon: { lastCommit: 'aaa', recordedAt: '2026-08-21T00:00:00.000Z' } };
    const after = { kapsalon: { lastCommit: 'aaa', recordedAt: '2026-08-22T00:00:00.000Z' } };
    assert.equal(lastRunsNeedCommit(before, after, ['kapsalon']), true);
  });

  it('is true when lastCommit changes', () => {
    const before = { kapsalon: { lastCommit: 'aaa', recordedAt: '2026-08-22T00:00:00.000Z' } };
    const after = { kapsalon: { lastCommit: 'bbb', recordedAt: '2026-08-22T00:00:00.000Z' } };
    assert.equal(lastRunsNeedCommit(before, after, ['kapsalon']), true);
  });

  it('is false when last-run time and commit are unchanged', () => {
    const entry = { lastCommit: 'aaa', recordedAt: '2026-08-22T00:00:00.000Z' };
    assert.equal(
      lastRunsNeedCommit({ kapsalon: entry }, { kapsalon: { ...entry } }, ['kapsalon']),
      false,
    );
  });
});

describe('lastRunsCommitMessage', () => {
  it('uses add when every id is new', () => {
    assert.equal(
      lastRunsCommitMessage('frontend-format', ['kapsalon'], {}),
      'chore(frontend-format): add last-run for kapsalon',
    );
  });

  it('uses record when an existing last-run time changes', () => {
    assert.equal(
      lastRunsCommitMessage('frontend-lint', ['kapsalon'], { kapsalon: { lastCommit: 'aaa' } }),
      'chore(frontend-lint): record last-run for kapsalon',
    );
  });
});

describe('commitLastRunsIfNeeded', () => {
  it('refuses a detached HEAD', () => {
    assert.throws(
      () =>
        commitLastRunsIfNeeded({
          beforeApps: {},
          afterApps: { kapsalon: { lastCommit: 'aaa', recordedAt: 't' } },
          ids: ['kapsalon'],
          skillId: 'frontend-format',
          relPath: REL,
          branch: 'HEAD',
          runGit: () => '',
        }),
      /detached HEAD/,
    );
  });

  it('refuses a child worktree branch', () => {
    assert.throws(
      () =>
        commitLastRunsIfNeeded({
          beforeApps: {},
          afterApps: { kapsalon: { lastCommit: 'aaa', recordedAt: 't' } },
          ids: ['kapsalon'],
          skillId: 'frontend-format',
          relPath: REL,
          branch: 'frontend-format-kapsalon',
          runGit: () => '',
        }),
      /child worktree branch/,
    );
  });

  it('skips when last-run time did not change', () => {
    const entry = { lastCommit: 'aaa', recordedAt: 't' };
    const result = commitLastRunsIfNeeded({
      beforeApps: { kapsalon: entry },
      afterApps: { kapsalon: { ...entry } },
      ids: ['kapsalon'],
      skillId: 'frontend-format',
      relPath: REL,
      branch: 'master',
      runGit: () => {
        throw new Error('git should not run');
      },
    });
    assert.deepEqual(result, { committed: false, reason: 'unchanged' });
  });

  it('commits only last-runs.json when the file is added the first time', () => {
    const dir = tempRepo();
    writeFileSync(join(dir, 'OTHER.txt'), 'leave me\n');
    const after = {
      kapsalon: {
        path: 'apps/kapsalon',
        lastCommit: 'aaa',
        recordedAt: '2026-08-22T00:00:00.000Z',
      },
    };
    writeLastRuns(dir, after);
    const result = commitLastRunsIfNeeded({
      beforeApps: {},
      afterApps: after,
      ids: ['kapsalon'],
      skillId: 'frontend-format',
      relPath: REL,
      branch: gitIn(dir, ['rev-parse', '--abbrev-ref', 'HEAD']),
      runGit: (args, opts) => gitIn(dir, args, opts),
    });
    assert.equal(result.committed, true);
    assert.equal(result.message, 'chore(frontend-format): add last-run for kapsalon');
    const files = gitIn(dir, ['show', '--pretty=', '--name-only', 'HEAD'])
      .split(/\r?\n/)
      .filter(Boolean);
    assert.deepEqual(files, [REL]);
    assert.equal(gitIn(dir, ['status', '--porcelain', '--', 'OTHER.txt']), '?? OTHER.txt');
  });

  it('commits last-runs.json when recordedAt changes', () => {
    const dir = tempRepo();
    const before = {
      kapsalon: {
        path: 'apps/kapsalon',
        lastCommit: 'aaa',
        recordedAt: '2026-08-21T00:00:00.000Z',
      },
    };
    writeLastRuns(dir, before);
    gitIn(dir, ['add', '--', REL]);
    gitIn(dir, ['commit', '-m', 'seed last-runs']);
    const after = {
      kapsalon: {
        path: 'apps/kapsalon',
        lastCommit: 'aaa',
        recordedAt: '2026-08-22T12:00:00.000Z',
      },
    };
    writeLastRuns(dir, after);
    const result = commitLastRunsIfNeeded({
      beforeApps: before,
      afterApps: after,
      ids: ['kapsalon'],
      skillId: 'frontend-format',
      relPath: REL,
      branch: gitIn(dir, ['rev-parse', '--abbrev-ref', 'HEAD']),
      runGit: (args, opts) => gitIn(dir, args, opts),
    });
    assert.equal(result.committed, true);
    assert.equal(result.message, 'chore(frontend-format): record last-run for kapsalon');
    const files = gitIn(dir, ['show', '--pretty=', '--name-only', 'HEAD'])
      .split(/\r?\n/)
      .filter(Boolean);
    assert.deepEqual(files, [REL]);
  });
});
