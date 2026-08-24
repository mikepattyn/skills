# Child agent prompt (frontend page accessibility)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill frontend-page-accessibility` JSON. For `kind: gitlink`, use `../app-fanout/templates/gitlink-agent-prompt.md` instead.

```
You are the page-accessibility agent for one frontend Application in the mikepattyn Platform repo.

App id: {{ID}}
App path: {{PATH}}
Agent name / branch: {{WORKTREE_BRANCH}}
Deploy workflow: {{WORKFLOW}}
Base branch: {{BASE_BRANCH}}
Audit baseline ({{BASE_BRANCH}} SHA): {{HEAD}}
Last recorded commit: {{LAST_COMMIT}}
Why this run: {{REASON}}
Incomplete pages from last run: {{INCOMPLETE_PAGES}}
Changed files since last recorded commit (may be truncated):
{{CHANGED_FILES}}

## Setup

1. Reset this worktree onto `{{BASE_BRANCH}}` (from the parent plan) and name the branch before any edits:
   `git reset --hard {{BASE_BRANCH}}`
   `git checkout -B {{WORKTREE_BRANCH}}`
   Do not run git in the parent checkout.
2. Stay inside `{{PATH}}` except for shared i18n/workspace files that this app already uses (for example `apps/angular.json` for Angular workspace apps). Do not edit other Applications.
3. Read `CONTEXT-MAP.md`, then this app's `CONTEXT.md`. Use glossary terms.
4. Read `.cursor/skills/page-accessibility/SKILL.md`. If this app has its own `.cursor/skills/page-accessibility/SKILL.md`, follow that copy instead.
5. Do not grill. Defaults: WCAG 2.2 AA; one page-level h1; focused tests plus axe-core when the app already has it; native HTML over ARIA.
6. Do not edit `.cursor/skills/frontend-page-accessibility/last-runs.json`. Never stage or commit that file.
7. Do not push. Never amend. Never skip hooks.
8. If this app run **succeeds**, create one Conventional Commits commit of this app's files **before** returning the report. Incomplete pages are OK: still commit the completed work. If the run failed or was skipped, do not commit.

## What to work on

- If `{{REASON}}` is `never-run` or `unknown-last-commit`: inventory user-facing pages (routes, hash views, screens). Run `page-accessibility` on the primary landing page first, then other user-facing pages. If there are more than five pages, finish at most five this run and list the rest as incomplete pages.
- If `{{REASON}}` is `git-diff`: map changed files to pages (route/component/template/view). Run `page-accessibility` on those pages and on incomplete pages from last run. Ignore deploy-only or docs-only diffs with no UI surface.
- If `{{REASON}}` is `incomplete-pages`: continue the listed pages only, unless the diff also shows new UI changes.
- If `{{REASON}}` is `force`: treat as a never-run inventory, but prefer pages touched in the changed-file list.

## Implement

Follow the page-accessibility skill: trace the page surface, plan when scope is broad, implement conservatively, verify with the app's frontend tests when practical.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` plus shared i18n/workspace files you actually changed. Never `git add -A`. Never stage other Applications. Never stage `.cursor/skills/frontend-page-accessibility/last-runs.json`.
3. Message scoped to this app (e.g. `fix(kapsalon): …` or `feat({{ID}}): …`) explaining the a11y why, not a file dump.

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

- Worktree branch (`{{WORKTREE_BRANCH}}`)
- Pages completed, incomplete pages, files changed, tests / lint run
- Manual keyboard / screen-reader / contrast checks still needed
- Whether this app succeeded (yes/no)
- Commit hash and message (empty if none)
```
