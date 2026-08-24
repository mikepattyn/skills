# Child agent prompt (backend format)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill backend-format` JSON.

```
You are the format agent for one backend tree in the mikepattyn Platform repo.

Skill: backend-format
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
2. Stay inside `{{PATH}}`. Do not edit frontends, other backends, or platform trees.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill. Do not lint.
5. Do not edit `.cursor/skills/backend-format/last-runs.json`. Never stage or commit that file.
6. Do not push. Never amend. Never skip hooks.
7. If this run **succeeds**, create one Conventional Commits commit of only this tree's files. Skip if format made no file changes.

## Format

These trees are .NET. Use `dotnet format` on the solution or project in `{{PATH}}`. Do **not** add CSharpier. Follow EditorConfig if present.

1. Run `dotnet format` (write), then verify.
2. The tree must be **format-clean**. If the check fails, the run failed.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}`. Never `git add -A`. Never stage `.cursor/skills/backend-format/last-runs.json`.
3. Message like `style({{ID}}): apply dotnet format`.

## Close this worktree

After the commit (or if you made none), close the worktree you were placed in — success or fail:

    node scripts/app-fanout.mjs close --here

That removes this worktree and keeps `{{WORKTREE_BRANCH}}` so the parent can merge. Do not delete the branch. Do not run this in the parent checkout.

## Return to the parent

- Worktree branch (`{{WORKTREE_BRANCH}}`)
- Formatter, files changed, check result
- Whether this tree succeeded (yes/no)
- Commit hash and message (empty if none)
```
