---
name: frontend-page-accessibility
description: >-
  Orchestrates /page-accessibility across all frontend Applications. Discovers
  apps from root deploy-*-frontend.yml and deploy-*-content.yml plus Canvas
  and Ondernemingsplan gitlinks, skips unchanged trees via last-run git
  commits against the current local branch, and fans out one isolated worktree agent per
  dirty app (max 40). Use when the user wants to run page accessibility on
  every frontend. Do not mix format or lint into this launch. Do not invoke
  platform-quality.
---

# Frontend page accessibility

Reusable **orchestrator** for the platform `page-accessibility` skill. This skill does **not** audit a page itself. It discovers frontend Applications, diffs each tree against the last recorded commit on the **current local branch**, and launches one isolated worktree agent per app that still needs work.

Planning uses [`scripts/app-fanout.mjs`](../../scripts/app-fanout.mjs) (`--skill frontend-page-accessibility`).

New frontends enroll automatically via `add-frontend-deploy-workflow`. Canvas and Ondernemingsplan enroll as `extraTrees` gitlinks (clone the pinned SHA). Do **not** maintain an app list here.

## Progress

```
Progress:
- [ ] 1. Plan (discover + git diff against the current branch)
- [ ] 2. Fan out one worktree agent per launchNow app
- [ ] 3. Merge each successful branch into the plan baseBranch (or bump gitlink)
- [ ] 4. Close each opened worktree (`close --skill …`; `--base-worktree` after the wave)
- [ ] 5. Record last-run commits using that branch's new SHA (commits last-runs.json)
- [ ] 6. Summarize remaining manual checks
```

## Defaults (do not grill per app)

Resolved for every child unless the user overrides in this chat:

- Accessibility target: WCAG 2.2 AA for the page and children
- Verification: focused assertions + axe-core when the app already has it; note keyboard/screen-reader checks tools cannot prove
- Headings: one page-level `h1`, labelled sections below
- Stay inside that app's path
- Never push
- When an app agent **succeeds**, it must create a Conventional Commits commit of **only that app's files** before returning its report. Incomplete pages are OK: still commit the completed work. Failed or skipped apps do not commit
- `last-runs.json` is parent-only; the executing parent commits it when `record` adds an id or changes last-run time
- Children close their worktree with `close --here` before they return (keeps the branch). The parent always runs `close --skill` after merge or failure so leftovers do not stay open
- Launch **only** `launchNow` (at most 40). Task description = `frontend-page-accessibility-<id>`
- Do **not** invoke `platform-quality`

## Parent checkout (do not move it)

- The parent checkout **never** `git checkout`s a child `worktreeBranch`.
- The parent **never** `git reset --hard` (not to `master`, not to anything).
- Children work only in the isolated `best-of-n-runner` worktree (or `.worktrees/gitlinks/<id>`). They never run git in the parent path.
- After launch, the parent stays on the plan `baseBranch` until it merges.
- After every child (success or fail), close that worktree. After the wave, close `.worktrees/<baseBranch>` if you created it.

## 1. Plan

```
node scripts/app-fanout.mjs plan --skill frontend-page-accessibility
```

Wrappers: `./scripts/frontend-page-accessibility.sh plan` or `./scripts/frontend-page-accessibility.ps1 plan` (same as `./scripts/app-fanout.ps1 plan --skill frontend-page-accessibility`).

Optional: `--force`, repeatable `--app <id>`, `--base <branch>` (default is the current checkout).

Treat `status: "needs-run"` as work. Skip `up-to-date` (`no-diff`) and `skipped`. Launch **only** `launchNow` (at most 40). If `deferred` is non-empty, merge + close + record the finished wave and tell the user to re-run. If `launchNow` is empty, report that and stop — the plan already diffs each tree from its last recorded commit to the current `baseBranch` tip. Plan `head` and `baseBranch` are the current local branch. Fill `{{BASE_BRANCH}}` from that field.

## 2. Fan out (Multitask + worktrees)

- Orchestrate only in the parent. Do not apply `page-accessibility` in this checkout when two or more apps `launchNow`.
- Launch **one Task per launchNow app**, all in **one** message (parallel). Never more than 40.
- `subagent_type`: `best-of-n-runner`. `environment`: `local`.
- `run_in_background`: `true` whenever this session is Multitask Mode **or** you are launching two or more app agents.
- Task `description`: `agentName` (e.g. `frontend-page-accessibility-kapsalon`).
- Do not poll those agents. End the turn after launch.
- Link each agent as `[AppName](id)`.
- Owned trees: [agent-prompt.md](agent-prompt.md). Gitlinks: [../app-fanout/templates/gitlink-agent-prompt.md](../app-fanout/templates/gitlink-agent-prompt.md) with `{{STEP}}` = `page-accessibility`. Pass `{{BASE_BRANCH}}` from the plan.

Also tell owned-tree children:

- Read `.cursor/skills/page-accessibility/SKILL.md`
- If `apps/<…>/.cursor/skills/page-accessibility/SKILL.md` exists, prefer that copy
- Read `CONTEXT-MAP.md` and the app `CONTEXT.md`
- Load `responsive-frontend` only when the a11y work changes layout/CSS

## 3. Merge, close, then record

Merge `worktreeBranch` into the plan `baseBranch` (or `.worktrees/<baseBranch>` if this checkout is not still on that branch). Gitlink children: bump only the gitlink pointer. Then close the worktree that child opened — success or fail, merged or not:

```
node scripts/app-fanout.mjs close --skill frontend-page-accessibility <id>
```

After the last child of the wave, if you created `.worktrees/<baseBranch>` for merges:

```
node scripts/app-fanout.mjs close --skill frontend-page-accessibility --base-worktree
```

Then record **that branch's new SHA**:

```
node scripts/app-fanout.mjs record --skill frontend-page-accessibility --commit <base-sha> <id>
```

If the child left pages for a later run:

```
… record --commit <base-sha> --incomplete-pages "StaffDashboard,BookFlow" kapsalon
```

Do not record apps that failed or were skipped. `record` Conventional-Commits **only** that skill's `last-runs.json` when an id is new or `recordedAt` / `lastCommit` changed. Do not leave the file unstaged.

## 4. Summarize

For each app: status, pages touched, files changed, tests run, incomplete pages, leftover manual keyboard/screen-reader checks, the child's commit, whether it was merged into `baseBranch`, and whether the worktree was closed. Never push.

## Out of scope

- Format and lint (`frontend-format`, `frontend-lint`)
- Backend-only trees, Mapbox, Flyingdarts
- `platform-quality`
- Infrastructure deploys
