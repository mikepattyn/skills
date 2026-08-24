# Child agent prompt (format)

Parent fills every `{{…}}` field from the matching `node scripts/app-fanout.mjs plan --skill <id>` JSON. Send this as the full Task prompt. The child has no parent chat history.

Replace `{{SKILL}}` and `{{LAST_RUNS}}` when copying into a skill folder. Use [gitlink-agent-prompt.md](gitlink-agent-prompt.md) instead when the plan row has `gitlink`.

```
You are the format agent for one tree in the mikepattyn Platform repo.

Skill: {{SKILL}}
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
   Do not create any other branches. Do not run git in the parent checkout. Never `git checkout` `{{BASE_BRANCH}}` in any other directory.
2. Stay inside `{{PATH}}` except for shared workspace files that this tree already uses (for example `apps/angular.json` or `apps/package.json` only if this tree is an Angular workspace app and you must). The email tree may also format sibling `packages/Mikepattyn.Email.Tests`. Do not edit other Applications or other fan-out trees.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill.
5. Do not edit `{{LAST_RUNS}}`. Never stage or commit that file — the parent records it.
6. Do not push. Never amend. Never skip hooks.
7. If this run **succeeds**, create one Conventional Commits commit of **only this tree's files** before returning the report. Skip the commit if format made no file changes. If the run failed or was skipped, do not commit.

## Tooling

Detect the stack in `{{PATH}}` (and nested projects you own). Do **not** replace existing formatter config (Staying Grounded Prettier, kapsalon `.prettierrc`, Flutter `dart format` / `analysis_options.yaml`).

- Angular workspace apps (dashboard, theming, viewports, lumen under `apps/`): use the workspace `apps/` Prettier. Do **not** add a second config. Do **not** edit `apps/package.json` to re-add Prettier — it is already there. Run format scoped so you only write files under `{{PATH}}` (for example `npx prettier --write <path>` from `apps/`).
- JS/TS/HTML/CSS isolated trees with no Prettier: copy `.cursor/skills/app-fanout/assets/.prettierrc` and add `format` / `format:check` scripts if a package.json exists.
- Dart / Flutter: `dart format` on the tree.
- .NET: `dotnet format` on the solution or project in the tree. Follow `infra/cdk/.editorconfig` when the tree is CDK. Do not add CSharpier.
- If a `format` script already exists, run it (or an equivalent write + check). Add the script only when missing.

## Implement

1. Add missing formatter config or scripts as above.
2. Run the formatter write, then a check.
3. The tree must be **format-clean**. If the check fails, the run failed.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` plus shared workspace files you actually had to change (plus Email.Tests if you formatted it). Never `git add -A`. Never stage other trees. Never stage `{{LAST_RUNS}}`.
3. Never push, never amend, never skip hooks.
4. Message scoped to this tree (e.g. `style({{ID}}): format with prettier` or `style({{ID}}): apply dart format`).

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

Write a short report with:

- Worktree branch name (`{{WORKTREE_BRANCH}}`)
- Formatter used (and whether you added config)
- Files changed
- Check command and result
- Whether this tree succeeded (yes/no)
- Commit hash and message (empty if none)
```
