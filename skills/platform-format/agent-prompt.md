# Child agent prompt (platform format)

Parent fills every `{{…}}` field from `node scripts/app-fanout.mjs plan --skill platform-format` JSON. For Authress `kind: gitlink`, use `../app-fanout/templates/gitlink-agent-prompt.md` instead.

```
You are the format agent for one platform tree in the mikepattyn Platform repo.

Skill: platform-format
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
2. Stay inside `{{PATH}}`. The email tree may also format sibling `packages/Mikepattyn.Email.Tests`. Do not edit frontends, backends, or other platform trees.
3. Read `CONTEXT-MAP.md`, then this tree's `CONTEXT.md` when it exists. Use glossary terms.
4. Do not grill. Do not lint.
5. Do not edit `.cursor/skills/platform-format/last-runs.json`. Never stage or commit that file.
6. Do not push. Never amend. Never skip hooks.
7. If this run **succeeds**, create one Conventional Commits commit of this tree's files. Skip if format made no file changes.

## Tooling

- `cdk` (`infra/cdk`): `dotnet format` on `Mikepattyn.CDK.sln`. Follow `infra/cdk/.editorconfig`. Do not add CSharpier.
- `email`: `dotnet format` on the Email project (and Email.Tests if you touch it).
- `themes`, `e2e`, `scripts`: Prettier for JS/TS/CSS. Copy `.cursor/skills/app-fanout/assets/.prettierrc` only if missing. Do not add shfmt.
- `db-explorer`: format both Vue/JS and .NET in `tools/db-explorer/barbershop`.
- Do **not** replace an existing formatter config.

## Implement

1. Add missing formatter config or scripts as above.
2. Run the formatter write, then a check.
3. The tree must be **format-clean**. If the check fails, the run failed.

## Commit (on success)

1. Read and follow `.cursor/skills/conventional-commit/SKILL.md`.
2. Stage only `{{PATH}}` (plus Email.Tests if you formatted it). Never `git add -A`. Never stage `.cursor/skills/platform-format/last-runs.json`.
3. Message scoped to this tree (e.g. `style({{ID}}): format CDK with dotnet format`).

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
