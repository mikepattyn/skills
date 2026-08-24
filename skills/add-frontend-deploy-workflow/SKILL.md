---
name: add-frontend-deploy-workflow
description: >-
  Adds a root GitHub Actions workflow that builds a frontend Application and
  publishes it to S3/CloudFront via SSM parameters (OIDC, path filters, env
  matrix or Production-only). Use whenever the user asks to add, create, or
  wire a frontend/content deploy workflow, GitHub Action for an app under
  apps/, deploy-*-frontend.yml, deploy-*-content.yml, or to ship static/SPA
  assets the same way as existing Mikepattyn frontend deploys — even if they
  only say "deploy this app from CI" or "add a deploy workflow".
---

# Add frontend deploy workflow

Create one root workflow under `.github/workflows/` that matches existing
frontend/content deploy patterns in this Platform repo. Do **not** put new
workflows under `apps/*/.github` (those are legacy and do not run here).

## Workflow

Copy this checklist and track it:

```
Progress:
- [ ] 1. Gather inputs
- [ ] 2. Choose variant (multi-env vs Production-only)
- [ ] 3. Infer build + publish details
- [ ] 4. Write workflow file
- [ ] 5. Sanity-check against siblings
```

### 1. Gather inputs

Resolve from the user and the repo (ask only for what you cannot infer):

| Input | How to find |
|-------|-------------|
| App path | e.g. `apps/<name>` |
| Display name | Human title in `name:` (e.g. `Deploy Lumen content`) |
| CDK / SSM app segment | PascalCase under `Constants.Apps` (e.g. `Lumen`, `Kapsalon`) — used in `/{App}/{Env}/Frontend/...` |
| Workflow filename slug | kebab-case: `deploy-<slug>-frontend.yml` or `deploy-<slug>-content.yml` |
| Default branch | This platform repo uses `master` (not `main`) |
| Submodule? | App path in `.gitmodules` (Authress, Mapbox, Canvas, Ondernemingsplan only) → token + `submodules: true`. Owned apps use plain checkout. |

Prefer **content** in the filename/title for brand/static sites with little or no CI build ceremony; prefer **frontend** for product SPAs (Kapsalon/Fish-style). Match sibling naming when unsure.

### 2. Choose variant

| Variant | When | Canonical examples |
|---------|------|--------------------|
| **Multi-env** | App has Development / Staging / Production hostnames | `deploy-kapsalon-frontend.yml`, `deploy-fish-frontend.yml` |
| **Production-only** | Brand or single-env site (Production only) | `deploy-mikepattyn-content.yml`, `deploy-lumen-content.yml`, `deploy-alienbutnice-content.yml` |

Read `CONTEXT.md` Hostnames table and/or CDK stack composition if unclear.

### 3. Infer build + publish details

Inspect the app directory:

| Signal | Build approach |
|--------|----------------|
| `package.json` with `build` | Node 26 + `npm ci` + `npm run build` (add `cache` + `cache-dependency-path` when a lockfile exists) |
| Flutter (`pubspec.yaml`) + web | Flutter stable action + `flutter build web` (see fish workflow for dart-defines) |
| Static HTML/assets, no build | Skip setup/build; sync source tree (exclude `.git/*`, `.cursor/*` as in Lumen) |
| Angular (or other) with env files | Follow that app's existing local/Make build; do not invent a second config scheme |

**Artifact path** (`SOURCE`): find the real build output (`dist`, `dist/.../browser`, `build/web`, or the app root for static). Prefer confirming via `package.json` scripts / README / existing Make `sync-*` target.

**SSM parameters** (after OIDC):

- Default: `/{App}/{Env}/Frontend/BucketName` and `.../DistributionId`
- Fish edge is the known exception: `WebBucket` instead of `BucketName`
- Confirm in CDK (`PublishSsm` / `PublishSsmParameter`) or `docs/research/individual-app-deploy.md` when the stack already exists
- If infra is not merged yet, use the default `BucketName` naming and note that CDK must publish those params

**Path filters**:

- Owned app tree: `'apps/<path>/**'`
- Remaining gitlinks only (Authress, Mapbox, Canvas, Ondernemingsplan): `'<path>'` with no `/**` if the parent sees only the gitlink
- Always include the workflow file itself in `paths`

### 4. Write the workflow

Create `.github/workflows/<filename>`.

Read the matching template and copy structure faithfully:

- Multi-env → [references/multi-env-frontend.yml](references/multi-env-frontend.yml)
- Production-only → [references/production-content.yml](references/production-content.yml)

Shared conventions (do not drift):

- `permissions: id-token: write` + `contents: read`
- `AWS_REGION: ${{ vars.AWS_REGION || 'eu-central-1' }}`
- `aws-actions/configure-aws-credentials@v4` with `role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}`
- Publish step: `aws ssm get-parameter` → `aws s3 sync ... --delete` → `aws cloudfront create-invalidation` paths `/*`
- For multi-env: `resolve-targets` job, matrix `environment`, `fail-fast: false`, `workflow_dispatch` env choice, repo var `DEPLOY_<SLUG>_FRONTEND_ALL_ENVS` (or content equivalent) gating all-envs on push
- Push default target: Development for multi-env; Production for Production-only
- Checkout: plain `actions/checkout@v4` unless the job needs Authress or Mapbox → token + `submodules: true` (not recursive; Canvas and Ondernemingsplan stay `update = none`)

Fill placeholders from step 1–3. Keep app-specific build commands in the Build step only; keep the Publish step structurally identical to siblings.

### 5. Sanity-check

Diff mentally against the closest existing workflow:

- Same job/step names where possible
- No CDK deploy in this workflow (infra is `deploy-cdk.yml` / Make `cdk-deploy-*`)
- No new secrets beyond patterns already used (`AWS_DEPLOY_ROLE_ARN`, `SUBMODULE_TOKEN`, app-specific build secrets if the app already needs them)
- Tell the user what was created and any repo settings still needed (GitHub Environment names, `DEPLOY_*_ALL_ENVS` var, Authress redirects if hostnames are new)
- The platform skill `frontend-page-accessibility` discovers frontend apps from these `deploy-*-frontend.yml` / `deploy-*-content.yml` files. Adding this workflow enrolls the app in the next accessibility run — do not maintain a second app list there.

## Out of scope

Unless the user explicitly asks, do **not**:

- Add Makefile `sync-*` / `deploy-*` targets
- Create or modify CDK stacks
- Add backend deploy workflows
- Move or delete legacy workflows under `apps/*/.github`
