---
name: scripts-to-node
description: >-
  Orchestrates converting native Unix (.sh) and PowerShell (.ps1) scripts into
  Node.js (.mjs) implementations, then leaves the shells as thin wrappers that
  only start Node. Discovers tracked script stems, skips gitlinks, already
  converted trios, and stems with no git diff since last run, and fans out one
  isolated worktree agent per remaining stem (max 40). Tests must run the .mjs
  (node --test / node stem.mjs), not bash or pwsh. Use when the user wants to
  convert shell scripts to Node, make .sh/.ps1 wrappers, run /scripts-to-node,
  or align scripts with the test flow. Also the convert wave of
  /platform-quality. Do not invoke platform-quality.
---

# Scripts to Node

Reusable **orchestrator**. This skill does **not** convert a stem itself. It discovers tracked `.sh` / `.ps1` families, skips ones that already wrap a sibling `.mjs` and stems with no git diff since last run, and launches one isolated worktree agent per stem that still has native shell logic. Each child ports **one** stem, writes tests against the Node file, and replaces both shells with the wrapper templates.

Going forward, new scripts are Node first; `.sh` and `.ps1` are only wrappers (see [templates](templates/wrapper.sh)). Do not mix format, lint, or page-accessibility into this launch. `/platform-quality` runs this as its convert wave (after page-accessibility, before lint and format).

Planning uses [`scripts/app-fanout.mjs`](../../scripts/app-fanout.mjs) (`--skill scripts-to-node`). Discovery lives in [`scripts/script-stems.mjs`](../../scripts/script-stems.mjs).

Shared assets: [app-fanout](../app-fanout/README.md). Conversion how-to: [references/convert.md](references/convert.md).

## Progress

```
Progress:
- [ ] 1. Plan (discover stems; skip already-node wrappers)
- [ ] 2. Fan out one worktree agent per launchNow stem
- [ ] 3. Merge each successful branch into the plan baseBranch
- [ ] 4. Close each opened worktree (`close --skill …`; `--base-worktree` after the wave)
- [ ] 5. Record last-run commits using that branch's new SHA (commits last-runs.json)
- [ ] 6. Summarize
```

## Defaults (do not grill per stem)

- One stem per agent: the `.mjs` implementation, both wrappers, and `stem.test.mjs`
- Tests run Node (`node --test`, or `node {{STEM}}.mjs`). Wrappers are not the test runner
- Copy [templates/wrapper.sh](templates/wrapper.sh) and [templates/wrapper.ps1](templates/wrapper.ps1) — do not invent a second wrapper dialect
- Stay on that stem's files (plus a test-job workflow line that already invoked this stem)
- Never push
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `scripts-to-node-<id>`
- Do **not** invoke `platform-quality`

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree. They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill scripts-to-node
```

Wrappers: `./scripts/app-fanout.sh plan --skill scripts-to-node` or `./scripts/app-fanout.ps1 plan --skill scripts-to-node`.

Optional: `--force`, repeatable `--app <id>` (slug like `scripts-build-lambda`), `--base <branch>`.

Treat `status: "needs-run"` as work. Skip `up-to-date` (`already-node` or `no-diff`) and `skipped`. If `launchNow` is empty, report that and stop — the plan diffs each stem from its last recorded commit to the current `baseBranch` tip, and skips stems that already wrap Node. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

Each plan row includes `stem`, `dir`, and `scriptFiles` (`sh`, `ps1`, `mjs`). Pass those into the child prompt. `sh` or `ps1` may be null — the child still writes both wrappers.

## 2. Fan out (Multitask + worktrees)

- Orchestrate only in the parent. Do not convert stems in this checkout when two or more stems `launchNow`.
- Launch **one Task per launchNow id**, all in **one** message (parallel). Never more than 40.
- `subagent_type`: `best-of-n-runner`. `environment`: `local`. `run_in_background`: `true` when Multitask Mode **or** two or more agents.
- Task `description`: the plan row's `agentName` (e.g. `scripts-to-node-scripts-build-lambda`).
- Do not poll. End the turn after launch.
- Link each agent as `[stem](id)`.
- Child prompt: [agent-prompt.md](agent-prompt.md). Pass `{{BASE_BRANCH}}` from the plan.

## 3. Merge, close, then record

After each successful child, merge `worktreeBranch` into the plan **`baseBranch`**:

- If this checkout is still on `baseBranch` and merge-clean: `git merge <worktreeBranch>`
- Otherwise: `git worktree add .worktrees/<baseBranch> <baseBranch>` if missing, then `git -C .worktrees/<baseBranch> merge <worktreeBranch>`

Merge one branch at a time. On conflict, leave that branch unmerged and report it. Do not `--force`. Do not `git checkout` the child branch here.

Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill scripts-to-node scripts-build-lambda
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill scripts-to-node --base-worktree
```

Then record **that branch's new SHA** (not the pre-run plan head):

```
node scripts/app-fanout.mjs record --skill scripts-to-node --commit <base-sha> scripts-build-lambda
```

`record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record failed or skipped stems.

## 4. Summarize

For each stem: status, reason, files, whether tests ran via Node, commit, worktree branch, whether it was merged into `baseBranch`, whether the worktree was closed. Never push.

## Out of scope

- Format / lint / page-accessibility
- `platform-quality`
- Gitlink trees (Canvas, Ondernemingsplan, Authress, Flyingdarts, Mapbox)
- Infrastructure deploys
