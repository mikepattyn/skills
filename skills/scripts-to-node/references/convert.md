# Convert one script stem to Node

Child agents read this when porting a `.sh` / `.ps1` family. The `.mjs` is the implementation. Tests run that file. Shells only start Node.

## Layout

For stem `scripts/build-lambda`:

| File | Role |
| ---- | ---- |
| `scripts/build-lambda.mjs` | Implementation (ESM). Export `main(argv)` for tests. |
| `scripts/build-lambda.test.mjs` | `node --test` against `main` or `node stem.mjs`. Do not spawn bash/pwsh as the assertion path. |
| `scripts/build-lambda.sh` | Copy [templates/wrapper.sh](../templates/wrapper.sh) |
| `scripts/build-lambda.ps1` | Copy [templates/wrapper.ps1](../templates/wrapper.ps1) |

Both wrappers are required even if only one native shell existed.

## Node implementation

- `#!/usr/bin/env node`, ESM, `node:` builtins only unless the containing package already has a dependency you need.
- Resolve paths from `import.meta.url`, not `cwd`, so Make/CI/wrappers all work.
- Preserve CLI args, stdout/stderr, and exit codes.
- Spawn existing CLIs (`dotnet`, `aws`, `npm`) with `execFileSync` / `spawnSync` and `stdio: 'inherit'` when the native script did. Do not reimplement those tools.
- Zip: if the shells disagreed (`zip` vs `Compress-Archive`), pick a Node-side approach that works on Windows and Unix (platform spawn is fine).
- Do not `exec` the old `.sh` / `.ps1` as the implementation.

Direct-run guard so tests can import `main`:

```js
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function main(argv) {
  // ...
  return 0;
}

function isDirectRun(metaUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(resolve(entry)).href === metaUrl;
}

if (isDirectRun(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code ?? 0))
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}
```

## Tests (the flow that must run Node)

- Add `{{STEM}}.test.mjs` next to the implementation.
- Run `node --test {{STEM}}.test.mjs` until it passes.
- Test the public seam: `main(argv)` or spawning `process.execPath` on the `.mjs`. Expected values from the spec (required args, missing files, path building) — not a restatement of the implementation.
- Do not call AWS, deploy, or mutate real cloud resources. Extract parse/build helpers when the script is a thin CLI over `aws`/`dotnet`.
- GitHub **test** jobs that invoked this stem via `bash`/`pwsh` should call `node {{STEM}}.mjs` and path-filter the `.mjs`. Deploy jobs may keep calling the wrappers.

## Calling another repo script

Prefer the sibling `.mjs` via `process.execPath`. If that file is not there yet (parallel conversion), spawn the existing `.sh` / `.ps1` and say so in the report.

## Makefile and docs

Leave `$(SCRIPT_RUN) ./scripts/foo.$(SCRIPT_EXT)` targets — they keep working as wrappers. Update README examples that show only one shell when you touch that doc. Do not rewrite the whole Makefile.

## Do not

- Add a root `package.json` or new npm dependencies for a one-off script.
- Edit other stems, `last-runs.json`, or unrelated workflows.
- Replace this stem's behavior with a similarly named script in another folder (root `scripts/copy-theme-package.sh` is not `apps/scripts/copy-theme-package.mjs`).
- Push, amend, or skip hooks.
