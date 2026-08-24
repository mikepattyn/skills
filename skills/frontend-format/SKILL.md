---
name: frontend-format
description: >-
  Orchestrates formatting across all frontend Applications. Discovers apps from
  root deploy-*-frontend.yml and deploy-*-content.yml plus Canvas and
  Ondernemingsplan gitlinks, diffs last-run commits against the current local
  branch, and fans out one isolated worktree agent per dirty app (max 40).
  Each child only formats. Use when the user wants to format every frontend or
  run /frontend-format. Do not mix lint or page-accessibility into this launch.
  Do not invoke platform-quality.
---

# Frontend format

Reusable **orchestrator**. This skill does **not** format a tree itself. It discovers frontend Applications, diffs each tree against the last recorded commit on the **current local branch**, and launches one isolated worktree agent per app that still needs work. Each child runs **format only** and makes one Conventional Commit when files change.

New frontends enroll automatically via `add-frontend-deploy-workflow`. Canvas and Ondernemingsplan enroll as `extraTrees` gitlinks (clone the pinned SHA; do not edit the umbrella checkout).

Planning uses [`scripts/app-fanout.mjs`](../../../scripts/app-fanout.mjs) (`--skill frontend-format`).

Shared assets: [app-fanout](../app-fanout/README.md).

## Progress

```
Progress:
- [ ] 1. Plan (discover + git diff against the current branch)
- [ ] 2. Fan out one worktree agent per launchNow app
- [ ] 3. Merge each successful branch into the plan baseBranch (or bump gitlink)
- [ ] 4. Close each opened worktree (`close --skill …`; `--base-worktree` after the wave)
- [ ] 5. Record last-run commits using that branch's new SHA (commits last-runs.json)
- [ ] 6. Summarize
```

## Defaults (do not grill per app)

- Format until format-clean
- Do not lint. Do not run page-accessibility
- Do not replace existing formatter config (Staying Grounded, kapsalon `.prettierrc`, Flutter)
- Angular workspace apps use `apps/` Prettier
- Isolated trees may copy app-fanout assets
- Stay inside that app's path
- Never push
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `frontend-format-<id>`
- Do **not** invoke `platform-quality`
- If `deferred` is non-empty, merge + close + record the finished wave and tell the user to re-run

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree (or `.worktrees/gitlinks/<id>`). They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill frontend-format
```

Wrappers: `./scripts/app-fanout.sh plan --skill frontend-format` or `./scripts/app-fanout.ps1 plan --skill frontend-format`.

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- Orchestrate only in the parent. Do not format in this checkout when two or more apps `launchNow`.
- Launch **one Task per launchNow id**, all in **one** message (parallel). Never more than 40.
- `subagent_type`: `best-of-n-runner`. `environment`: `local`. `run_in_background`: `true` when Multitask Mode **or** two or more agents.
- Task `description`: the plan row's `agentName` (e.g. `frontend-format-kapsalon`).
- Do not poll. End the turn after launch.
- Link each agent as `[AppName](id)`.
- Owned trees: [agent-prompt.md](agent-prompt.md). Gitlink rows: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` = `format`. Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

After each successful **owned-tree** child, merge `worktreeBranch` into the plan **`baseBranch`**:

- If this checkout is still on `baseBranch` and merge-clean: `git merge <worktreeBranch>`
- Otherwise: `git worktree add .worktrees/<baseBranch> <baseBranch>` if missing, then `git -C .worktrees/<baseBranch> merge <worktreeBranch>`

Merge one branch at a time. On conflict, leave that branch unmerged and report it. Do not `--force`. Do not `git checkout` the child branch here.

After each successful **gitlink** child, in that same `baseBranch` worktree update **only** the gitlink pointer to the clone's new SHA and Conventional Commit that pointer. Do not merge a platform branch for the gitlink.

Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill frontend-format kapsalon
```

`close` removes any leftover worktree, deletes the child branch, and removes `.worktrees/gitlinks/<id>` when the row was a gitlink. Children should have already run `close --here` (worktree gone, branch kept). Parent `close` is required either way.

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill frontend-format --base-worktree
```

Then record **that branch's new SHA** (not the pre-run plan head):

```
node scripts/app-fanout.mjs record --skill frontend-format --commit <base-sha> kapsalon
```

`record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failed or skipped apps.

## 4. Summarize

For each app: status, formatter, files, commit, worktree branch, whether it was merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Lint (`frontend-lint`) and page accessibility (`frontend-page-accessibility`)
- Backends and platform remainder
- Mapbox and Flyingdarts
- `platform-quality` (user-invoked only)
- Infrastructure deploys
