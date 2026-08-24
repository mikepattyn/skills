/**
 * When to Conventional-Commit a skill last-runs.json after `record`.
 * The executing parent owns this file; child worktrees never touch it.
 */
const AGENT_WORKTREE_BRANCH_RE =
  /^(frontend|backend|platform)-(format|lint|page-accessibility)-|^scripts-to-node-/;

export function isAgentWorktreeBranch(name) {
  return AGENT_WORKTREE_BRANCH_RE.test(name);
}

export function lastRunsNeedCommit(beforeApps, afterApps, ids) {
  for (const id of ids) {
    const before = beforeApps?.[id];
    const after = afterApps?.[id];
    if (!after) continue;
    if (!before) return true;
    if (before.recordedAt !== after.recordedAt) return true;
    if (before.lastCommit !== after.lastCommit) return true;
  }
  return false;
}

export function lastRunsCommitMessage(skillId, ids, beforeApps) {
  const added = ids.filter((id) => !beforeApps?.[id]);
  const who = ids.length <= 4 ? ids.join(', ') : `${ids.length} trees`;
  if (added.length === ids.length) {
    return `chore(${skillId}): add last-run for ${who}`;
  }
  return `chore(${skillId}): record last-run for ${who}`;
}

export function commitLastRunsIfNeeded({
  beforeApps,
  afterApps,
  ids,
  skillId,
  relPath,
  branch,
  runGit,
}) {
  if (!lastRunsNeedCommit(beforeApps, afterApps, ids)) {
    return { committed: false, reason: 'unchanged' };
  }
  if (!branch || branch === 'HEAD') {
    throw new Error('refusing to commit last-runs.json on a detached HEAD');
  }
  if (isAgentWorktreeBranch(branch)) {
    throw new Error(`refusing to commit last-runs.json on child worktree branch '${branch}'`);
  }
  const status = runGit(['status', '--porcelain', '--untracked-files=normal', '--', relPath], {
    allowFail: true,
  });
  if (!status || !String(status).trim()) {
    return { committed: false, reason: 'clean' };
  }
  const message = lastRunsCommitMessage(skillId, ids, beforeApps);
  runGit(['add', '--', relPath]);
  runGit(['commit', '--only', '-m', message, '--', relPath]);
  const commit = runGit(['rev-parse', 'HEAD'], { allowFail: true });
  return { committed: true, message, commit: commit || undefined };
}
