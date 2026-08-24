---
name: platform-quality
description: >-
  User-invoked umbrella only. Sequences page accessibility, then scripts-to-node,
  then lint, then format last across every enrolled frontend, backend, and
  platform tree (including Authress, Canvas, and Ondernemingsplan gitlink
  clones). One agent per tree per step, worktrees from the current local branch,
  merge into that branch between waves, max 40 per wave. Use only when the user
  typed /platform-quality or asked to run all quality workflows. Never start
  this skill from frontend-format, frontend-lint, or any other orchestrator.
---

# Platform quality (umbrella)

Reusable **umbrella orchestrator**. This skill does **not** format, lint, convert, or audit a tree itself. It plans every nested skill, launches **one wave at a time**, merges successful branches into the **current local branch**, closes each opened worktree, records last-runs (and commits each nested `last-runs.json` when an entry is added or last-run time changes), then plans the next wave.

**User-invoked only.** Start this skill only when the current user message called `/platform-quality` (or this skill by name). Atomic orchestrators must never launch it.

Planning uses [`scripts/app-fanout.mjs`](../../../scripts/app-fanout.mjs) (`--skill platform-quality`). The script reads the current branch and puts it on every `launchNow` row as `baseBranch`. Pass that through to every child as `{{BASE_BRANCH}}`. Each nested skill diffs that tree (or stem) from its last recorded commit to the current tip. Empty `launchNow` means no diff — skip the wave.

## Progress

```
Progress:
- [ ] 1. Confirm the user invoked this skill directly
- [ ] 2. Plan the current wave (re-plan after each merge)
- [ ] 3. Fan out one agent per launchNow row (max 40)
- [ ] 4. Merge owned-tree branches into baseBranch; bump gitlink pointers
- [ ] 5. Close each opened worktree (nested `close --skill …`; `--base-worktree` after the wave)
- [ ] 6. Record each nested skill using that branch's new SHA (commits last-runs.json)
- [ ] 7. Next wave, or stop if deferred / empty
- [ ] 8. Summarize
```

## Waves (never combine steps)

Same-tree lint and format must not run in parallel. Convert scripts before lint/format so new `.mjs` files get both.

1. **page-accessibility** — `frontend-page-accessibility` only
2. **convert** — `scripts-to-node` only (Node implementations; `.sh` / `.ps1` stay wrappers)
3. **lint** — `frontend-lint` + `backend-lint` + `platform-lint`
4. **format** — `frontend-format` + `backend-format` + `platform-format` (last)

Re-run `plan --skill platform-quality --wave <n>` after each wave's merges so diffs see the new `baseBranch` tip.

## Defaults

- Cap **40** agents per wave (shared across nested skills, not 40 each)
- Task `description` = plan `agentName` (`frontend-page-accessibility-kapsalon`)
- `best-of-n-runner`, `environment: local`, background when two or more
- Do not poll. End the turn after launch
- Never push
- `last-runs.json` files are parent-only; record per nested skill, never `--skill platform-quality`. `record` commits that file when an entry is added or last-run time changes
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs nested `close --skill` after merge or failure so leftovers do not stay open
- Mapbox and Flyingdarts stay out

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree (or `.worktrees/gitlinks/<id>`). They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill platform-quality --wave 0
```

After page-accessibility merges: `--wave 1` (convert). After convert merges: `--wave 2` (lint). After lint merges: `--wave 3` (format).

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

If the current wave's `launchNow` is empty (`no-diff` / `already-node` / skipped), skip to the next wave. If every remaining wave is empty, stop. If `deferred` is non-empty, finish this slice, then re-plan the same wave.

## 2. Fan out

- One Task per `launchNow` row, one message, never more than 40
- Fill the **nested skill's** agent prompt (`frontend-page-accessibility/agent-prompt.md`, `scripts-to-node/agent-prompt.md`, etc.) including `{{BASE_BRANCH}}` from the plan
- Gitlink rows: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` matching the wave
- Convert rows include `stem`, `dir`, and `scriptFiles` — pass those into the scripts-to-node prompt
- Link each agent as `[agentName](id)`

## 3. Merge, close, then record

Owned trees: merge `worktreeBranch` into the plan `baseBranch`. If this checkout is still on that branch and merge-clean, merge here. Otherwise `git worktree add .worktrees/<baseBranch> <baseBranch>` and merge there.

Gitlinks: in that same `baseBranch` worktree, point only the gitlink at the clone's new SHA and Conventional Commit that pointer.

Then close the worktree that child opened — success or fail, merged or not — using the **nested** skill:

```
node scripts/app-fanout.mjs close --skill frontend-page-accessibility kapsalon
node scripts/app-fanout.mjs close --skill scripts-to-node scripts-build-lambda
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill frontend-page-accessibility --base-worktree
```

Then record the **nested** skill with that branch's new SHA:

```
node scripts/app-fanout.mjs record --skill frontend-page-accessibility --commit <base-sha> kapsalon
node scripts/app-fanout.mjs record --skill scripts-to-node --commit <base-sha> scripts-build-lambda
```

`record` Conventional-Commits **only** that nested skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged. Do not record the umbrella. Do not record failures.

## 4. Summarize

Per wave: launched, merged, gitlink bumps, closed worktrees, deferred, skipped empty (`no-diff`), failures. Never push.

## Out of scope

- Starting this skill unless the user invoked it
- Combining lint and format in one child
- Mapbox, Flyingdarts, infrastructure deploys
