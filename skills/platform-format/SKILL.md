---
name: platform-format
description: >-
  Orchestrates formatting for platform remainder trees: infra/cdk,
  packages/Mikepattyn.Email, packages/themes, tools/db-explorer/barbershop,
  root e2e, scripts, plus Authress package gitlinks. Diffs last-run commits
  against the current local branch and fans out one worktree agent per dirty tree
  (max 40). Use when the user wants to format CDK, packages, tools, e2e, or
  scripts, or run /platform-format. Do not mix lint into this launch. Do not
  invoke platform-quality.
---

# Platform format

Reusable **orchestrator**. Trees are the explicit list in [`scripts/app-fanout.config.json`](../../../scripts/app-fanout.config.json) (`platform-format.trees`). That is not a parse of CONTEXT-MAP. Dashboard's backend lambda lives under `infra/cdk` and is owned by the `cdk` tree.

Authress Flutter/Angular enroll as gitlinks (clone the pinned SHA). Mapbox and Flyingdarts stay out.

Shared assets: [app-fanout](../app-fanout/README.md).

## Progress

```
Progress:
- [ ] 1. Plan (discover + git diff against the current branch)
- [ ] 2. Fan out one worktree agent per launchNow tree
- [ ] 3. Merge each successful branch into the plan baseBranch (or bump gitlink)
- [ ] 4. Close each opened worktree (`close --skill …`; `--base-worktree` after the wave)
- [ ] 5. Record last-run commits using that branch's new SHA (commits last-runs.json)
- [ ] 6. Summarize
```

## Defaults (do not grill per tree)

- Format until format-clean
- CDK: `dotnet format` on `Mikepattyn.CDK.sln`, follow `infra/cdk/.editorconfig`
- Email: .NET `dotnet format` (also `packages/Mikepattyn.Email.Tests` if you touch the package)
- themes / e2e / scripts: Prettier for JS/TS/CSS; do not add shfmt
- db-explorer: Vue + .NET — format both stacks in that tree
- Stay inside that tree's path
- Never push
- On success, child commits **only that tree**
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `platform-format-<id>`
- Do **not** invoke `platform-quality`

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree (or `.worktrees/gitlinks/<id>`). They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill platform-format
```

Wrappers: `./scripts/app-fanout.sh plan --skill platform-format` or `./scripts/app-fanout.ps1 plan --skill platform-format`.

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- One Task per `launchNow` id, one message, `best-of-n-runner`, `environment: local`, background when two or more. Never more than 40.
- Task `description`: `agentName` (e.g. `platform-format-cdk`).
- Do not poll. Do not mix lint children.
- Owned trees: [agent-prompt.md](agent-prompt.md). Authress gitlinks: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` = `format`. Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

Merge `worktreeBranch` into the plan `baseBranch` (or `.worktrees/<baseBranch>`). Gitlink children: bump only the gitlink pointer. Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill platform-format cdk
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill platform-format --base-worktree
```

Then:

```
node scripts/app-fanout.mjs record --skill platform-format --commit <base-sha> cdk
```

No incomplete list. `record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failures.

## 4. Summarize

Status, formatter, files, commit, whether merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Lint (`platform-lint`)
- Frontends (`frontend-format`) and backends (`backend-format`)
- Mapbox, Flyingdarts, Canvas, Ondernemingsplan (those last two are frontend extraTrees)
- `platform-quality`
- Infrastructure deploys
