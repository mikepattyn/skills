# Child agent prompt (frontend format)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill frontend-format` JSON. Send this as the full Task prompt for **owned** trees. For `kind: gitlink`, use `../app-fanout/templates/gitlink-agent-prompt.md` instead.

```
You are the format agent for one frontend tree in the mikepattyn Platform repo.

Skill: frontend-format
Tree id: {{ID}}
Tree path: {{PATH}}
Agent name / branch: {{WORKTREE_BRANCH}}
Deploy workflow: {{WORKFLOW}}
Base branch: {{BASE_BRANCH}}
Format baseline ({{BASE_BRANCH}} SHA): {{HEAD}}
Last recorded commit: {{LAST_COMMIT}}
Why this run: {{REASON}}
Changed files since last recorded commit (may be truncated):
{{CHANGED_FILES}}

## Setup

1. Reset this worktree onto `{{BASE_BRANCH}}` (from the parent plan) and name the branch before any edits:
   `git reset --hard {{BASE_BRANCH}}`
   `git checkout -B {{WORKTREE_BRANCH}}`
   Do not run git in the parent checkout.
2. Stay inside `{{PATH}}` except for shared workspace files that this tree already uses (for example `apps/angular.json` or `apps/package.json` only if this tree is an Angular workspace app and you must). Do not edit other Applications.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill.
5. Do not edit `.cursor/skills/frontend-format/last-runs.json`. Never stage or commit that file.
6. Do not push. Never amend. Never skip hooks. Do not lint.
7. If this run **succeeds**, create one Conventional Commits commit of only this tree's files. Skip the commit if format made no file changes.

## Tooling

Do **not** replace existing formatter config (Staying Grounded Prettier, kapsalon `.prettierrc`, Flutter `dart format` / `analysis_options.yaml`).

- Angular workspace apps (dashboard, theming, viewports, lumen under `apps/`): use the workspace `apps/` Prettier. Do **not** add a second config. Do **not** edit `apps/package.json` to re-add Prettier. Run format scoped to `{{PATH}}`.
- JS/TS/HTML/CSS isolated trees with no Prettier: copy `.cursor/skills/app-fanout/assets/.prettierrc` and add `format` / `format:check` scripts if a package.json exists.
- Dart / Flutter: `dart format` on the tree.
- If a `format` script already exists, run it (or an equivalent write + check).

## Implement

1. Add missing formatter config or scripts as above.
2. Run the formatter write, then a check.
3. The tree must be **format-clean**. If the check fails, the run failed.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` plus shared workspace files you actually had to change. Never `git add -A`. Never stage other trees. Never stage `.cursor/skills/frontend-format/last-runs.json`.
3. Message like `style({{ID}}): format with prettier` or `style({{ID}}): apply dart format`.

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

- Worktree branch (`{{WORKTREE_BRANCH}}`)
- Formatter used, files changed, check result
- Whether this tree succeeded (yes/no)
- Commit hash and message (empty if none)
```
