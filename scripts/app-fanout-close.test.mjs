import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { closeOpenedWorktrees, parseWorktreeList } from './app-fanout-close.mjs';

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
  const dir = mkdtempSync(join(tmpdir(), 'fanout-close-'));
  temps.push(dir);
  gitIn(dir, ['init']);
  gitIn(dir, ['config', 'user.email', 'fanout-test@example.com']);
  gitIn(dir, ['config', 'user.name', 'Fanout Test']);
  writeFileSync(join(dir, 'README'), 'init\n');
  gitIn(dir, ['add', '--', 'README']);
  gitIn(dir, ['commit', '-m', 'init']);
  return dir;
}

function addAgentWorktree(dir, branch) {
  const path = join(dir, '.worktrees', branch);
  mkdirSync(join(dir, '.worktrees'), { recursive: true });
  gitIn(dir, ['worktree', 'add', '-b', branch, path]);
  return path;
}

function closer(dir, opts) {
  return closeOpenedWorktrees({
    primaryPath: dir,
    listPorcelain: gitIn(dir, ['worktree', 'list', '--porcelain']),
    runGit: (args, options) => gitIn(dir, args, options),
    removeDir: (p) => rmSync(p, { recursive: true, force: true }),
    exists: (p) => existsSync(p),
    ...opts,
  });
}

after(() => {
  for (const dir of temps) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('parseWorktreeList', () => {
  it('reads primary and linked worktrees from porcelain', () => {
    const list = parseWorktreeList(`worktree /repos/app
HEAD aaa
branch refs/heads/master

worktree /repos/app/.worktrees/frontend-lint-fish
HEAD bbb
branch refs/heads/frontend-lint-fish
`);
    assert.deepEqual(list, [
      { path: '/repos/app', head: 'aaa', branch: 'master', detached: false },
      {
        path: '/repos/app/.worktrees/frontend-lint-fish',
        head: 'bbb',
        branch: 'frontend-lint-fish',
        detached: false,
      },
    ]);
  });
});

describe('closeOpenedWorktrees', () => {
  it('refuses the primary checkout', () => {
    const dir = tempRepo();
    assert.throws(
      () =>
        closer(dir, {
          here: dir,
          deleteBranch: false,
        }),
      /primary checkout/,
    );
    assert.match(gitIn(dir, ['rev-parse', '--abbrev-ref', 'HEAD']), /./);
  });

  it('child --here removes the worktree and keeps the branch', () => {
    const dir = tempRepo();
    const path = addAgentWorktree(dir, 'frontend-lint-kapsalon');
    const result = closer(dir, {
      here: path,
      deleteBranch: false,
    });
    assert.equal(result.closed.length, 1);
    assert.equal(result.closed[0].branch, 'frontend-lint-kapsalon');
    assert.equal(existsSync(path), false);
    assert.equal(
      gitIn(dir, ['rev-parse', '--verify', 'frontend-lint-kapsalon']),
      gitIn(dir, ['rev-parse', 'HEAD']),
    );
    const listed = gitIn(dir, ['worktree', 'list', '--porcelain']);
    assert.equal(listed.includes('frontend-lint-kapsalon'), false);
  });

  it('parent close removes the worktree and deletes the agent branch', () => {
    const dir = tempRepo();
    const path = addAgentWorktree(dir, 'backend-lint-commerce');
    const result = closer(dir, {
      branches: ['backend-lint-commerce'],
      deleteBranch: true,
    });
    assert.equal(result.closed.length, 1);
    assert.equal(result.closed[0].deletedBranch, true);
    assert.equal(existsSync(path), false);
    assert.equal(
      gitIn(dir, ['rev-parse', '--verify', 'refs/heads/backend-lint-commerce'], {
        allowFail: true,
      }),
      '',
    );
  });

  it('parent still deletes the agent branch after the child already closed the worktree', () => {
    const dir = tempRepo();
    const path = addAgentWorktree(dir, 'scripts-to-node-scripts-build-lambda');
    closer(dir, { here: path, deleteBranch: false });
    const result = closer(dir, {
      branches: ['scripts-to-node-scripts-build-lambda'],
      deleteBranch: true,
    });
    assert.equal(
      result.closed.some((c) => c.deletedBranch),
      true,
    );
    assert.equal(
      gitIn(dir, ['rev-parse', '--verify', 'refs/heads/scripts-to-node-scripts-build-lambda'], {
        allowFail: true,
      }),
      '',
    );
  });

  it('is a no-op when the worktree is already gone', () => {
    const dir = tempRepo();
    const result = closer(dir, {
      branches: ['frontend-format-lumen'],
      deleteBranch: true,
    });
    assert.deepEqual(result.closed, []);
    assert.deepEqual(result.alreadyClosed, ['frontend-format-lumen']);
  });

  it('records a locked gitlink clone instead of aborting the close', () => {
    const dir = tempRepo();
    const cloneDir = join(dir, '.worktrees', 'gitlinks', 'canvas');
    mkdirSync(cloneDir, { recursive: true });
    writeFileSync(join(cloneDir, 'README'), 'clone\n');
    const result = closer(dir, {
      branches: ['frontend-lint-canvas'],
      cloneDirs: [join('.worktrees', 'gitlinks', 'canvas')],
      deleteBranch: true,
      removeDir: () => {
        throw new Error('EPERM, Permission denied');
      },
    });
    assert.equal(result.failed.length, 1);
    assert.match(result.failed[0].error, /EPERM/);
    assert.equal(existsSync(cloneDir), true);
  });

  it('removes a gitlink clone directory after the parent is done', () => {
    const dir = tempRepo();
    const cloneDir = join(dir, '.worktrees', 'gitlinks', 'canvas');
    mkdirSync(cloneDir, { recursive: true });
    writeFileSync(join(cloneDir, 'README'), 'clone\n');
    const result = closer(dir, {
      branches: ['frontend-lint-canvas'],
      cloneDirs: [join('.worktrees', 'gitlinks', 'canvas')],
      deleteBranch: true,
    });
    assert.equal(existsSync(cloneDir), false);
    assert.equal(
      result.closed.some((c) => c.cloneDir),
      true,
    );
  });

  it('closes a parent merge worktree for the base branch', () => {
    const dir = tempRepo();
    const base = gitIn(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
    gitIn(dir, ['checkout', '-b', 'orchestrator-elsewhere']);
    const path = join(dir, '.worktrees', base);
    mkdirSync(join(dir, '.worktrees'), { recursive: true });
    gitIn(dir, ['worktree', 'add', path, base]);
    const result = closer(dir, {
      baseWorktree: base,
      deleteBranch: true,
    });
    assert.equal(result.closed.length, 1);
    assert.equal(existsSync(path), false);
    assert.ok(gitIn(dir, ['rev-parse', '--verify', `refs/heads/${base}`], { allowFail: true }));
  });
});
