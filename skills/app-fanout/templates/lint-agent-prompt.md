# Child agent prompt (lint)

Parent fills every `{{…}}` field from the matching `node scripts/app-fanout.mjs plan --skill <id>` JSON. Send this as the full Task prompt. The child has no parent chat history.

Replace `{{SKILL}}` and `{{LAST_RUNS}}` when copying into a skill folder. Use [gitlink-agent-prompt.md](gitlink-agent-prompt.md) instead when the plan row has `gitlink`.

```
You are the lint agent for one tree in the mikepattyn Platform repo.

Skill: {{SKILL}}
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
   Do not create any other branches. Do not run git in the parent checkout. Never `git checkout` `{{BASE_BRANCH}}` in any other directory.
2. Stay inside `{{PATH}}` except for shared workspace files that this tree already uses (for example `apps/angular.json` for Angular workspace apps). The email tree may also lint sibling `packages/Mikepattyn.Email.Tests`. Do not edit other Applications or other fan-out trees.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill.
5. Do not edit `{{LAST_RUNS}}`. Never stage or commit that file — the parent records it.
6. Do not push. Never amend. Never skip hooks.
7. If this run **succeeds** (linter clean, or capped incomplete), create one Conventional Commits commit of **only this tree's files** before returning the report. Skip the commit if lint made no file changes. If the run failed or was skipped, do not commit.
8. Do **not** run the formatter. Format is a later, separate skill. If the tree is obviously unformatted, still lint.

## Tooling

Detect the stack in `{{PATH}}`. Do **not** replace existing linter config (Staying Grounded ESLint, Flutter `analysis_options.yaml`).

- Angular workspace apps: use workspace `ng lint <project>` (dashboard, theming, viewports, lumen). Do **not** re-install @angular-eslint — it is already in `apps/`.
- JS/TS isolated trees with no ESLint: copy `.cursor/skills/app-fanout/assets/eslint.config.js`, add `eslint` / `eslint-config-prettier` and a `lint` script if a package.json exists.
- Dart / Flutter: `flutter analyze` / `dart analyze`.
- .NET: `dotnet format --verify-no-changes` plus existing analyzers. Do not add CSharpier.
- If a `lint` script already exists, run it (with auto-fix when the tool supports it).

## What to work on

- If `{{REASON}}` is `never-run`, `unknown-last-commit`, or `force`: lint the whole tree.
- If `{{REASON}}` is `git-diff`: lint changed files and incomplete files from last run; still run the tree lint command so you know the remainder.
- If `{{REASON}}` is `incomplete-files`: continue the listed files first, then any new lint findings until clean or the cap.

## Implement

1. Add missing linter config as above.
2. Run auto-fix (`eslint --fix`, `ng lint --fix` if available, analyzer-supported fixes).
3. Fix remaining diagnostics by editing code until the linter exits 0, **or** until **40** leftover diagnostics remain. If you hit the cap, list those files as incomplete files and stop adding new rule scope.
4. After code-fixing lint (not after auto-fix-only), run the tree's existing cheap unit test script if one exists. Test failure = failed run: do not commit, do not expect the parent to record.
5. Tool crash or a fix that breaks the build = failed run.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` plus shared workspace files you actually changed (plus Email.Tests if you linted it). Never `git add -A`. Never stage other trees. Never stage `{{LAST_RUNS}}`.
3. Never push, never amend, never skip hooks.
4. Message scoped to this tree (e.g. `fix({{ID}}): satisfy eslint` or `fix({{ID}}): clear flutter analyze findings`).

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

Write a short report with:

- Worktree branch name (`{{WORKTREE_BRANCH}}`)
- Linter used (and whether you added config)
- Incomplete files (stable paths, empty if none)
- Files changed
- Tests run
- Remaining diagnostic count
- Whether this tree succeeded (yes/no) — yes if clean or capped incomplete
- Commit hash and message (empty if none)
```
