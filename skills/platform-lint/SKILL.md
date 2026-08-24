---
name: platform-lint
description: >-
  Orchestrates linting for platform remainder trees: infra/cdk,
  packages/Mikepattyn.Email, packages/themes, tools/db-explorer/barbershop,
  root e2e, scripts, plus Authress package gitlinks. Diffs last-run commits
  against the current local branch and fans out one worktree agent per dirty tree
  (max 40). Use when the user wants to lint CDK, packages, tools, e2e, or
  scripts, or run /platform-lint. Do not mix format into this launch. Do not
  invoke platform-quality.
---

# Platform lint

Reusable **orchestrator**. Same tree list as `platform-format` in [`scripts/app-fanout.config.json`](../../../scripts/app-fanout.config.json).

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

- Auto-fix, then fix leftovers until clean or **40** diagnostics
- Capped leftovers are incomplete files; still commit completed work
- CDK / Email: `dotnet format --verify-no-changes` plus analyzers. No CSharpier
- e2e / scripts: ESLint if present or add from app-fanout assets for JS/TS
- Do **not** run the formatter write pass
- Stay inside that tree's path
- Never push
- On success (clean or capped incomplete), child commits **only that tree**
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `platform-lint-<id>`
- Do **not** invoke `platform-quality`

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree (or `.worktrees/gitlinks/<id>`). They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill platform-lint
```

Wrappers: `./scripts/app-fanout.sh plan --skill platform-lint` or `./scripts/app-fanout.ps1 plan --skill platform-lint`.

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- One Task per `launchNow` id, one message, `best-of-n-runner`, `environment: local`, background when two or more. Never more than 40.
- Task `description`: `agentName` (e.g. `platform-lint-cdk`).
- Do not poll. Do not mix format children.
- Owned trees: [agent-prompt.md](agent-prompt.md). Authress gitlinks: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` = `lint`. Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

Merge `worktreeBranch` into the plan `baseBranch` (or `.worktrees/<baseBranch>`). Gitlink children: bump only the gitlink pointer. Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill platform-lint cdk
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill platform-lint --base-worktree
```

Then:

```
node scripts/app-fanout.mjs record --skill platform-lint --commit <base-sha> cdk
node scripts/app-fanout.mjs record --skill platform-lint --commit <base-sha> --incomplete-files "Foo.cs" cdk
```

`record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failures.

## 4. Summarize

Status, linter, files, tests, incomplete files, commit, whether merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Format (`platform-format`)
- Frontends (`frontend-lint`) and backends (`backend-lint`)
- Mapbox, Flyingdarts, Canvas, Ondernemingsplan
- `platform-quality`
- Infrastructure deploys
