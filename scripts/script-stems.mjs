/**
 * Discover tracked .sh / .ps1 families (stems) and classify whether they
 * already wrap a sibling Node implementation. Used by app-fanout
 * (`discover: script-stems`) for the scripts-to-node skill.
 */
import { basename, dirname } from 'node:path';

export const SKIP_DIR_PARTS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'cdk.out',
  'bin',
  'obj',
  '.worktrees',
  '.angular',
  'vendor',
  '.cursor',
]);

export function posix(p) {
  return p.replaceAll('\\', '/');
}

export function scriptKind(filePosix) {
  const p = posix(filePosix);
  if (/\.sh$/i.test(p)) return 'sh';
  if (/\.ps1$/i.test(p)) return 'ps1';
  return null;
}

export function posixStemFromScript(filePosix) {
  return posix(filePosix).replace(/\.(sh|ps1)$/i, '');
}

export function stemId(posixStem) {
  return posix(posixStem).replaceAll('/', '-');
}

export function pathHasSkippedDir(posixPath) {
  return posix(posixPath)
    .split('/')
    .some((part) => SKIP_DIR_PARTS.has(part));
}

export function isSkippedStem(posixStem, skipPrefixes = []) {
  const stem = posix(posixStem);
  if (pathHasSkippedDir(stem)) return true;
  return skipPrefixes.some((prefix) => {
    const p = posix(prefix).replace(/\/$/, '');
    return stem === p || stem.startsWith(`${p}/`);
  });
}

/**
 * True when a shell file only launches a sibling Node script.
 * Accepts a literal `<base>.mjs` / `<base>.js` or generic `$BASE.mjs` / `$Base.mjs`.
 */
export function isNodeWrapperText(text, base) {
  if (!text || typeof text !== 'string') return false;
  const body = text.replace(/\r\n/g, '\n');
  const mentionsNode = /\bnode\b/i.test(body);
  if (!mentionsNode) return false;

  const escaped = String(base).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionsImpl =
    new RegExp(`${escaped}\\.(mjs|js)\\b`).test(body) ||
    /\$BASE\.mjs\b/.test(body) ||
    /\$Base\.mjs\b/.test(body) ||
    /\$\{BASE\}\.mjs\b/.test(body) ||
    /\$\{Base\}\.mjs\b/.test(body);

  if (!mentionsImpl) return false;

  const launchesNode =
    /\bexec\s+node\b/.test(body) ||
    /& node\b/.test(body) ||
    /\bnode\s+["'$]/.test(body) ||
    /\bnode\s+\$/.test(body) ||
    /\bnode\s+\S+\.(mjs|js)\b/.test(body);

  return launchesNode;
}

export function groupScriptStems(relativePaths) {
  const map = new Map();
  for (const raw of relativePaths) {
    const filePosix = posix(raw);
    const kind = scriptKind(filePosix);
    if (!kind) continue;
    const stem = posixStemFromScript(filePosix);
    const entry = map.get(stem) ?? { stem, sh: null, ps1: null };
    entry[kind] = filePosix;
    map.set(stem, entry);
  }
  return [...map.values()].sort((a, b) => a.stem.localeCompare(b.stem));
}

export function classifyStem(entry, { exists, read }) {
  const base = basename(entry.stem);
  const mjs = `${entry.stem}.mjs`;
  const js = `${entry.stem}.js`;
  const impl = exists(mjs) ? mjs : exists(js) ? js : null;
  const targetMjs = mjs;

  const shText = entry.sh && exists(entry.sh) ? read(entry.sh) : '';
  const ps1Text = entry.ps1 && exists(entry.ps1) ? read(entry.ps1) : '';
  const hasSh = Boolean(entry.sh && exists(entry.sh));
  const hasPs1 = Boolean(entry.ps1 && exists(entry.ps1));
  const shWrap = hasSh && isNodeWrapperText(shText, base);
  const ps1Wrap = hasPs1 && isNodeWrapperText(ps1Text, base);

  if (impl && hasSh && hasPs1 && shWrap && ps1Wrap) {
    return { converted: true, impl, mjs: targetMjs, reason: 'already-node' };
  }
  if (impl && ((hasSh && !shWrap) || (hasPs1 && !ps1Wrap))) {
    return { converted: false, impl, mjs: targetMjs, reason: 'shell-not-wrapper' };
  }
  if (impl && (!hasSh || !hasPs1)) {
    return { converted: false, impl, mjs: targetMjs, reason: 'missing-wrapper-twin' };
  }
  if (!impl) {
    return { converted: false, impl: null, mjs: targetMjs, reason: 'missing-mjs' };
  }
  return { converted: false, impl, mjs: targetMjs, reason: 'native-shell' };
}

export function discoverScriptStems({ gitFiles, exists, read, gitlinkPrefixes = [] }) {
  const grouped = groupScriptStems(gitFiles);
  const apps = [];
  for (const entry of grouped) {
    if (isSkippedStem(entry.stem, gitlinkPrefixes)) continue;
    if (!entry.sh && !entry.ps1) continue;
    const classified = classifyStem(entry, { exists, read });
    const dir = dirname(entry.stem);
    apps.push({
      id: stemId(entry.stem),
      kind: 'script',
      workflow: null,
      path: entry.stem,
      dir: dir === '.' ? '' : dir,
      stem: entry.stem,
      gitlink: false,
      converted: classified.converted,
      convertReason: classified.reason,
      scriptFiles: {
        sh: entry.sh,
        ps1: entry.ps1,
        mjs: classified.mjs,
      },
    });
  }
  return apps;
}
