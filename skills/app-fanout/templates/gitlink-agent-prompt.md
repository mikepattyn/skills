# Child agent prompt (gitlink clone)

Parent fills every `{{…}}` field from the matching plan JSON (`gitlink` object). Send this as the full Task prompt when `kind` is `gitlink`. The child has no parent chat history.

Replace `{{SKILL}}`, `{{LAST_RUNS}}`, and `{{STEP}}` (`format`, `lint`, or `page-accessibility`).

```
You are the {{STEP}} agent for one gitlink in the mikepattyn Platform repo.

Skill: {{SKILL}}
Tree id: {{ID}}
Umbrella path (do not edit files here): {{PATH}}
Agent name / branch: {{WORKTREE_BRANCH}}
Clone directory: {{CLONE_DIR}}
Remote URL: {{GITLINK_URL}}
Platform base branch: {{BASE_BRANCH}}
Pinned SHA (from local {{BASE_BRANCH}}, not origin HEAD): {{PINNED_SHA}}
Base for this clone: {{PINNED_SHA}}
Last recorded platform commit: {{LAST_COMMIT}}
Why this run: {{REASON}}
Incomplete from last run: {{INCOMPLETE}}
Changed files since last recorded commit (may be truncated):
{{CHANGED_FILES}}

## Setup (clone, not the umbrella checkout)

1. Do **not** edit files under the umbrella `{{PATH}}` directory. Work only in `{{CLONE_DIR}}`.
2. If `{{CLONE_DIR}}` does not exist, `git clone {{GITLINK_URL}} {{CLONE_DIR}}`.
3. In `{{CLONE_DIR}}`:
   `git fetch --all`
   `git checkout --detach {{PINNED_SHA}}`
   `git checkout -B {{WORKTREE_BRANCH}}`
   Branch from the **pinned SHA**, not from the clone's `main`/`master` tip and not from the platform repo's `{{BASE_BRANCH}}`. Do not run git in the parent checkout.
4. Read `CONTEXT.md` in the clone when it exists. For Ondernemingsplan also read `docs/DRAAD.md`. Use that tree's glossary. Do not grill.
5. Do not edit `{{LAST_RUNS}}` in the platform repo. Never stage or commit that file.
6. Do not push the clone remote. Never amend. Never skip hooks.
7. If this run **succeeds**, create one Conventional Commits commit **in the clone** of only this clone's files. Skip the commit if the step made no file changes. If the run failed or was skipped, do not commit.

## Step: {{STEP}}

### format

Detect the stack in the clone. Do **not** replace existing formatter config.

- JS/TS/HTML/CSS: Prettier if present; otherwise copy platform `.cursor/skills/app-fanout/assets/.prettierrc` only when the clone has no formatter.
- Dart / Flutter: `dart format`.
- .NET: `dotnet format`. No CSharpier.
- Run write, then a check. The clone must be format-clean.

### lint

Do **not** run the formatter. Auto-fix, then fix leftovers until clean or **40** leftover diagnostics. Capped leftovers are incomplete files. After code-fixing lint, run a cheap existing unit test script if one exists. Test failure = failed run.

- JS/TS: ESLint if present, or copy platform `.cursor/skills/app-fanout/assets/eslint.config.js` only when missing.
- Dart / Flutter: `flutter analyze` / `dart analyze`.
- .NET: `dotnet format --verify-no-changes` plus existing analyzers.

### page-accessibility

Read the platform `.cursor/skills/page-accessibility/SKILL.md`. Prefer a copy in the clone if present. WCAG 2.2 AA. Inventory user-facing pages; if more than five on a never-run, finish at most five and list the rest as incomplete pages.

## Commit (on success, in the clone)

1. Follow Conventional Commits. Stage only files you changed in `{{CLONE_DIR}}`. Never `git add -A` of unrelated dirty files.
2. Never push, never amend, never skip hooks.
3. Message scoped to this tree (e.g. `style({{ID}}): format with prettier`).

## Close the platform worktree

After the commit (or if you made none), close the platform worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

Leave `{{CLONE_DIR}}` in place — the parent needs the new SHA, then the parent closes the clone. Do not delete the clone. Do not run this in the parent checkout.

## Return to the parent

Write a short report with:

- Clone directory and branch (`{{WORKTREE_BRANCH}}`)
- New clone commit hash (empty if none) — the parent will point the platform gitlink at this SHA
- Step result, files changed, incomplete pages/files
- Whether this tree succeeded (yes/no)
- Remind the parent: bump only the gitlink pointer on platform `{{BASE_BRANCH}}`; do not merge a platform branch for this tree
```
