---
name: frontend-lint
description: >-
  Orchestrates linting across all frontend Applications. Discovers apps from
  root deploy-*-frontend.yml and deploy-*-content.yml plus Canvas and
  Ondernemingsplan gitlinks, diffs last-run commits against the current local
  branch, and
  fans out one isolated worktree agent per dirty app (max 40). Each child only
  lints (auto-fix, then leftovers until clean or 40 diagnostics). Use when the
  user wants to lint every frontend or run /frontend-lint. Do not mix format
  into this launch. Do not invoke platform-quality.
---

# Frontend lint

Reusable **orchestrator**. Discovers the same frontend set as `frontend-format`. Each child runs **lint only**.

Planning uses [`scripts/app-fanout.mjs`](../../scripts/app-fanout.mjs) (`--skill frontend-lint`).

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

- Auto-fix, then leftovers until clean or **40** diagnostics
- Capped leftovers are incomplete files; still commit completed work
- Do not format
- Do not replace existing linter config
- Angular workspace apps use `ng lint <project>`
- Stay inside that app's path
- Never push
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `frontend-lint-<id>`
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
node scripts/app-fanout.mjs plan --skill frontend-lint
```

Wrappers: `./scripts/app-fanout.sh plan --skill frontend-lint` or `./scripts/app-fanout.ps1 plan --skill frontend-lint`.

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- One Task per `launchNow` id, one message, `best-of-n-runner`, `environment: local`, background when two or more. Never more than 40.
- Task `description`: `agentName` (e.g. `frontend-lint-kapsalon`).
- Do not poll. Do not mix format children.
- Owned trees: [agent-prompt.md](agent-prompt.md). Gitlinks: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` = `lint`. Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

Merge `worktreeBranch` into the plan `baseBranch` (or bump the gitlink pointer). Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill frontend-lint kapsalon
```

If this checkout is not still on `baseBranch`, merge in `.worktrees/<baseBranch>`. After the last child of the wave, if you created that merge worktree:

```
node scripts/app-fanout.mjs close --skill frontend-lint --base-worktree
```

Then:

```
node scripts/app-fanout.mjs record --skill frontend-lint --commit <base-sha> kapsalon
node scripts/app-fanout.mjs record --skill frontend-lint --commit <base-sha> --incomplete-files "src/a.ts" kapsalon
```

`record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failures. Do not `git checkout` the child branch here.

## 4. Summarize

Status, linter, incomplete files, commit, whether merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Format (`frontend-format`) and page accessibility
- Backends and platform remainder
- Mapbox and Flyingdarts
- `platform-quality`
- Infrastructure deploys
