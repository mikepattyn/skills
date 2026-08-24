# Child agent prompt (frontend lint)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill frontend-lint` JSON. For `kind: gitlink`, use `../app-fanout/templates/gitlink-agent-prompt.md` instead.

```
You are the lint agent for one frontend tree in the mikepattyn Platform repo.

Skill: frontend-lint
Tree id: {{ID}}
Tree path: {{PATH}}
Agent name / branch: {{WORKTREE_BRANCH}}
Deploy workflow: {{WORKFLOW}}
Base branch: {{BASE_BRANCH}}
Lint baseline ({{BASE_BRANCH}} SHA): {{HEAD}}
Last recorded commit: {{LAST_COMMIT}}
Why this run: {{REASON}}
Incomplete files from last run: {{INCOMPLETE_FILES}}
Changed files since last recorded commit (may be truncated):
{{CHANGED_FILES}}

## Setup

1. Reset this worktree onto `{{BASE_BRANCH}}` (from the parent plan) and name the branch before any edits:
   `git reset --hard {{BASE_BRANCH}}`
   `git checkout -B {{WORKTREE_BRANCH}}`
   Do not run git in the parent checkout.
2. Stay inside `{{PATH}}` except for shared workspace files this tree already uses. Do not edit other Applications.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill. Do not format.
5. Do not edit `.cursor/skills/frontend-lint/last-runs.json`. Never stage or commit that file.
6. Do not push. Never amend. Never skip hooks.
7. If this run **succeeds** (clean or capped incomplete), create one Conventional Commits commit of only this tree's files. Skip if lint made no file changes.

## Tooling

Do **not** replace existing linter config (Staying Grounded ESLint, Flutter `analysis_options.yaml`).

- Angular workspace apps: `ng lint <project>` (dashboard, theming, viewports, lumen). Do not re-install @angular-eslint.
- JS/TS isolated trees with no ESLint: copy `.cursor/skills/app-fanout/assets/eslint.config.js`, add `eslint` / `eslint-config-prettier` and a `lint` script if a package.json exists.
- Dart / Flutter: `flutter analyze` / `dart analyze`.
- If a `lint` script already exists, run it (with auto-fix when the tool supports it).

## What to work on

- `never-run`, `unknown-last-commit`, or `force`: lint the whole tree.
- `git-diff`: lint changed files and incomplete files from last run; still run the tree lint command.
- `incomplete-files`: continue the listed files first, then any new findings until clean or the cap.

## Implement

1. Add missing linter config as above.
2. Run auto-fix, then fix leftovers until exit 0 or **40** leftover diagnostics. List incomplete files if capped.
3. After code-fixing lint, run the tree's existing cheap unit test script if one exists. Test failure = failed run.
4. Tool crash or a fix that breaks the build = failed run.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` plus shared workspace files you actually changed. Never `git add -A`. Never stage `.cursor/skills/frontend-lint/last-runs.json`.
3. Message like `fix({{ID}}): satisfy eslint` or `fix({{ID}}): clear flutter analyze findings`.

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

- Worktree branch (`{{WORKTREE_BRANCH}}`)
- Linter, incomplete files, remaining diagnostic count, tests run
- Whether this tree succeeded (yes/no)
- Commit hash and message (empty if none)
```
