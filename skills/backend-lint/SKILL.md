---
name: backend-lint
description: >-
  Orchestrates linting across owned backend trees discovered from
  deploy-*-backend.yml whose path is under apps/. Diffs last-run commits
  against the current local branch and fans out one worktree agent per dirty tree
  (max 40). Each child only lints (dotnet format --verify-no-changes plus
  analyzers) until clean or 40 diagnostics. Do not mix format into this
  launch. Dashboard backend lives under infra/cdk — use /platform-lint. Do not
  invoke platform-quality.
---

# Backend lint

Reusable **orchestrator**. Same discovery as `backend-format`. Each child runs **lint only**.

Planning uses [`scripts/app-fanout.mjs`](../../../scripts/app-fanout.mjs) (`--skill backend-lint`).

Shared assets: [app-fanout](../app-fanout/README.md).

## Progress

```
Progress:
- [ ] 1. Plan (discover + git diff against the current branch)
- [ ] 2. Fan out one worktree agent per launchNow tree
- [ ] 3. Merge each successful branch into the plan baseBranch
- [ ] 4. Close each opened worktree (`close --skill …`; `--base-worktree` after the wave)
- [ ] 5. Record last-run commits using that branch's new SHA (commits last-runs.json)
- [ ] 6. Summarize
```

## Defaults (do not grill per tree)

- `dotnet format --verify-no-changes` plus existing analyzers until clean or **40** diagnostics
- Capped leftovers are incomplete files; still commit completed work
- Do not format. Do not add CSharpier
- Stay inside that tree's path
- Never push
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `backend-lint-<id>`
- Do **not** invoke `platform-quality`

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree. They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill backend-lint
```

Wrappers: `./scripts/app-fanout.sh plan --skill backend-lint` or `./scripts/app-fanout.ps1 plan --skill backend-lint`.

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- One Task per `launchNow` id, one message, `best-of-n-runner`, `environment: local`, background when two or more. Never more than 40.
- Task `description`: `agentName` (e.g. `backend-lint-fish`).
- Do not poll. Child prompt: [agent-prompt.md](agent-prompt.md). Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

Merge `worktreeBranch` into the plan `baseBranch` (or `.worktrees/<baseBranch>`). Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill backend-lint kapsalon
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill backend-lint --base-worktree
```

Then:

```
node scripts/app-fanout.mjs record --skill backend-lint --commit <base-sha> kapsalon
node scripts/app-fanout.mjs record --skill backend-lint --commit <base-sha> --incomplete-files "Foo.cs" kapsalon
```

`record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failures.

## 4. Summarize

Status, linter, incomplete files, commit, whether merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Format (`backend-format`)
- Frontends, platform remainder, Dashboard lambda (CDK)
- Gitlinks and infrastructure deploys
- `platform-quality`
