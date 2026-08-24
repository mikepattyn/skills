#!/usr/bin/env node
/**
 * Discover Application / platform trees and decide which need a skill run
 * since their last recorded commit. Used by the one-step orchestrators
 * (frontend/backend/platform format and lint, frontend-page-accessibility,
 * scripts-to-node) and the user-invoked umbrella platform-quality.
 *
 * Usage:
 *   node scripts/app-fanout.mjs list
 *   node scripts/app-fanout.mjs plan --skill <id> [--force] [--app <id> ...] [--wave <n>] [--base <branch>]
 *   node scripts/app-fanout.mjs record --skill <id> [--commit <sha>] [--base <branch>]
 *     [--incomplete-pages <csv>] [--incomplete-files <csv>] <id> [<id> ...]
 *   node scripts/app-fanout.mjs close --here
 *   node scripts/app-fanout.mjs close --skill <id> [--base-worktree] [--base <branch>] <id> [<id> ...]
 *
 * Plans and records against the current local branch (or --base), not a hardcoded master.
 * `record` writes last-runs.json and Conventional-Commits only that file when an
 * id is new or its last-run time / lastCommit changed. `close` removes the isolated
 * worktree the agent opened (children keep the branch; parent deletes it after merge).
 * Agents call this script; there are no Makefile plan/record targets.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeOpenedWorktrees, parseWorktreeList } from './app-fanout-close.mjs';
import { commitLastRunsIfNeeded } from './app-fanout-last-runs.mjs';
import { discoverScriptStems } from './script-stems.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const WORKFLOWS_DIR = join(ROOT, '.github', 'workflows');
const CONFIG_PATH = join(SCRIPT_DIR, 'app-fanout.config.json');
const GITMODULES_PATH = join(ROOT, '.gitmodules');
const APP_GLOB_RE = /^\s*-\s*['"]?(apps\/[^'"\s]+?)\/\*\*['"]?\s*$/;
const APP_PATH_RE = /^\s*-\s*['"]?(apps\/[^'"\s]+)['"]?\s*$/;
const SHARED_APP_ROOT = new Set([
  'apps/package.json',
  'apps/package-lock.json',
  'apps/angular.json',
  'apps/tsconfig.json',
  'apps/test-setup.ts',
]);
const MAX_CHANGED_FILES = 80;
const DEFAULT_MAX_LAUNCH = 40;
const AGENT_WORKTREE_BRANCH_RE =
  /^(frontend|backend|platform)-(format|lint|page-accessibility)-|^scripts-to-node-/;

function usage(exit = 1) {
  console.error(`Usage:
  node scripts/app-fanout.mjs list
  node scripts/app-fanout.mjs plan --skill <id> [--force] [--app <id> ...] [--wave <n>] [--base <branch>]
  node scripts/app-fanout.mjs record --skill <id> [--commit <sha>] [--base <branch>]
    [--incomplete-pages <csv>] [--incomplete-files <csv>] <id> [<id> ...]
  node scripts/app-fanout.mjs close --here
  node scripts/app-fanout.mjs close --skill <id> [--base-worktree] [--base <branch>] <id> [<id> ...]
  record commits that skill's last-runs.json when an id is new or last-run time changes.
  close removes the worktree the agent opened. --here keeps the branch; parent close deletes it.`);
  process.exit(exit);
}

function skillSteps(skill) {
  return Array.isArray(skill.steps) ? skill.steps.filter((s) => typeof s === 'string' && s) : [];
}

function isUmbrella(skill) {
  return skill?.kind === 'umbrella';
}

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFail) return '';
    const detail = err.stderr?.toString().trim() || err.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function gitOk(args) {
  try {
    execFileSync('git', ['-C', ROOT, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    return false;
  }
}

function posix(p) {
  return p.replaceAll('\\', '/');
}

function loadConfig() {
  const parsed = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  if (!parsed || typeof parsed.skills !== 'object' || parsed.skills === null) {
    throw new Error('scripts/app-fanout.config.json must be { skills: { ... } }');
  }
  return parsed;
}

function isAgentWorktreeBranch(name) {
  return AGENT_WORKTREE_BRANCH_RE.test(name);
}

function detectCurrentBranch() {
  const name = git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true });
  if (!name || name === 'HEAD') {
    throw new Error(
      'app-fanout needs a named branch; checkout is detached. Get back on the orchestrator branch first.',
    );
  }
  if (isAgentWorktreeBranch(name)) {
    throw new Error(
      `current branch '${name}' looks like an agent worktree. Checkout the orchestrator branch first (not a frontend-format-* / backend-lint-* / scripts-to-node-* child branch).`,
    );
  }
  return name;
}

function resolveBaseBranch(opts = {}) {
  const named = typeof opts.base === 'string' && opts.base ? opts.base : detectCurrentBranch();
  if (isAgentWorktreeBranch(named)) {
    throw new Error(
      `base branch '${named}' looks like an agent worktree. Use the orchestrator branch, not a child worktree branch.`,
    );
  }
  if (!gitOk(['rev-parse', '--verify', `${named}^{commit}`])) {
    throw new Error(`local branch '${named}' is required for app-fanout plans`);
  }
  return named;
}

function maxLaunchOf(config) {
  return Number(config.maxLaunch) > 0 ? Number(config.maxLaunch) : DEFAULT_MAX_LAUNCH;
}

function resolveBaseSha(branch) {
  return git(['rev-parse', branch]);
}

function resolveSkill(config, skillId) {
  if (!skillId) {
    throw new Error(`--skill is required. Known: ${Object.keys(config.skills).join(', ')}`);
  }
  const skill = config.skills[skillId];
  if (!skill) {
    throw new Error(`unknown skill '${skillId}'. Known: ${Object.keys(config.skills).join(', ')}`);
  }
  return skill;
}

function lastRunsPath(skill) {
  return join(ROOT, skill.lastRunsPath);
}

function loadLastRuns(skill) {
  const path = lastRunsPath(skill);
  if (!existsSync(path)) {
    return { version: 1, apps: {} };
  }
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (!parsed || parsed.version !== 1 || typeof parsed.apps !== 'object') {
    throw new Error(`${skill.lastRunsPath} must be { version: 1, apps: { ... } }`);
  }
  return parsed;
}

function extractAppPath(workflowText) {
  const lines = workflowText.split(/\r?\n/);
  let inPaths = false;
  const candidates = [];
  for (const line of lines) {
    if (!inPaths) {
      if (/^\s+paths:\s*$/.test(line)) inPaths = true;
      continue;
    }
    if (/^\s*$/.test(line) || /^\s+#/.test(line)) continue;
    if (!/^\s+-/.test(line)) break;
    const glob = line.match(APP_GLOB_RE);
    if (glob) {
      candidates.push(posix(glob[1]));
      continue;
    }
    const plain = line.match(APP_PATH_RE);
    if (plain) {
      const value = posix(plain[1]);
      if (!SHARED_APP_ROOT.has(value) && !value.startsWith('apps/scripts/')) {
        candidates.push(value);
      }
    }
  }
  return candidates[0] ?? null;
}

function discoverWorkflows(filenameRe, { kindOverride } = {}) {
  if (!existsSync(WORKFLOWS_DIR)) {
    throw new Error('Missing .github/workflows — cannot discover apps');
  }
  const apps = [];
  for (const name of readdirSync(WORKFLOWS_DIR).sort()) {
    const match = name.match(filenameRe);
    if (!match) continue;
    const workflowRel = posix(join('.github/workflows', name));
    const text = readFileSync(join(WORKFLOWS_DIR, name), 'utf8');
    const path = extractAppPath(text);
    if (!path) {
      console.error(`warning: ${workflowRel} has no apps/ path filter; skipped`);
      continue;
    }
    apps.push({
      id: match[1],
      kind: kindOverride ?? match[2],
      workflow: workflowRel,
      path,
      gitlink: false,
    });
  }
  return apps;
}

function treeEntry(tree, kindDefault) {
  const gitlink = Boolean(tree.gitlink);
  return {
    id: tree.id,
    kind: gitlink ? 'gitlink' : kindDefault,
    workflow: null,
    path: posix(tree.path),
    gitlink,
  };
}

function discoverTrees(trees) {
  if (!Array.isArray(trees) || !trees.length) {
    throw new Error("discover 'trees' requires a non-empty trees array");
  }
  return trees.map((tree) => treeEntry(tree, 'tree'));
}

function discoverExtraTrees(skill) {
  if (!Array.isArray(skill.extraTrees) || !skill.extraTrees.length) return [];
  return skill.extraTrees.map((tree) => treeEntry(tree, 'tree'));
}

function discover(skill) {
  let apps;
  switch (skill.discover) {
    case 'deploy-frontend-content':
      apps = discoverWorkflows(/^deploy-(.+)-(frontend|content)\.yml$/);
      break;
    case 'deploy-backend':
      apps = discoverWorkflows(/^deploy-(.+)-backend\.yml$/, { kindOverride: 'backend' });
      break;
    case 'trees':
      apps = discoverTrees(skill.trees);
      break;
    case 'script-stems':
      apps = discoverScriptStems({
        gitFiles: git(['ls-files'], { allowFail: true }).split(/\r?\n/).filter(Boolean),
        exists: (p) => existsSync(join(ROOT, p)),
        read: (p) => readFileSync(join(ROOT, p), 'utf8'),
        gitlinkPrefixes: [...loadGitmodules().keys()],
      });
      break;
    default:
      throw new Error(`unknown discover '${skill.discover}'`);
  }
  return [...apps, ...discoverExtraTrees(skill)];
}

function unknownIdMessage(skill, id) {
  if (skill.discover === 'deploy-frontend-content') {
    return `unknown frontend id '${id}' — no matching deploy-*-frontend.yml, deploy-*-content.yml, or extraTrees`;
  }
  if (skill.discover === 'deploy-backend') {
    return `unknown backend id '${id}' — no matching deploy-*-backend.yml with an apps/ path`;
  }
  if (skill.discover === 'script-stems') {
    return `unknown script stem '${id}' — no tracked .sh/.ps1 at that stem`;
  }
  return `unknown tree id '${id}' — not in the trees list for this skill`;
}

function commitExists(sha) {
  if (!sha) return false;
  return gitOk(['cat-file', '-e', `${sha}^{commit}`]);
}

function changedFiles(lastCommit, head, pathOrPaths) {
  if (!lastCommit || !commitExists(lastCommit)) return [];
  const paths = (Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths]).filter(Boolean);
  if (!paths.length) return [];
  const out = git(['diff', '--name-only', `${lastCommit}..${head}`, '--', ...paths], {
    allowFail: true,
  });
  if (!out) return [];
  return out.split(/\r?\n/).filter(Boolean);
}

function scriptDiffPaths(discovered) {
  const files = discovered.scriptFiles ?? {};
  return [
    files.sh,
    files.ps1,
    files.mjs,
    discovered.stem ? `${discovered.stem}.js` : null,
    discovered.stem ? `${discovered.stem}.test.mjs` : null,
  ].filter(Boolean);
}

function incompleteKey(skill) {
  if (skill.incompleteField === 'pages') return 'incompletePages';
  if (skill.incompleteField === 'files') return 'incompleteFiles';
  return null;
}

function incompleteReason(skill) {
  if (skill.incompleteField === 'pages') return 'incomplete-pages';
  if (skill.incompleteField === 'files') return 'incomplete-files';
  return null;
}

function recordedIncomplete(recorded, skill) {
  const key = incompleteKey(skill);
  if (!key) return [];
  return Array.isArray(recorded[key]) ? recorded[key] : [];
}

function loadGitmodules() {
  const map = new Map();
  if (!existsSync(GITMODULES_PATH)) return map;
  const text = readFileSync(GITMODULES_PATH, 'utf8');
  let currentPath = null;
  let currentUrl = null;
  const flush = () => {
    if (currentPath && currentUrl) map.set(posix(currentPath), currentUrl);
    currentPath = null;
    currentUrl = null;
  };
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\[submodule/.test(line)) {
      flush();
      continue;
    }
    const pathMatch = line.match(/^\s*path\s*=\s*(.+?)\s*$/);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }
    const urlMatch = line.match(/^\s*url\s*=\s*(.+?)\s*$/);
    if (urlMatch) currentUrl = urlMatch[1];
  }
  flush();
  return map;
}

function gitlinkMeta(discovered, branch, modules) {
  if (!discovered.gitlink) return null;
  const url = modules.get(discovered.path) ?? null;
  const pinnedSha = git(['rev-parse', `${branch}:${discovered.path}`], { allowFail: true });
  return {
    url,
    pinnedSha: pinnedSha || null,
    cloneDir: posix(`.worktrees/gitlinks/${discovered.id}`),
  };
}

function agentName(skillId, id) {
  return `${skillId}-${id}`;
}

function planAtomic(skillId, opts, config) {
  const skill = resolveSkill(config, skillId);
  if (isUmbrella(skill)) {
    throw new Error(`skill '${skillId}' is an umbrella — use planUmbrella`);
  }
  const branch = resolveBaseBranch(opts);
  const head = resolveBaseSha(branch);
  const lastRuns = loadLastRuns(skill);
  const wanted = new Set(opts.apps);
  const modules = loadGitmodules();
  const apps = [];

  for (const discovered of discover(skill)) {
    if (wanted.size && !wanted.has(discovered.id)) continue;
    const recorded = lastRuns.apps[discovered.id] ?? {};
    const lastCommit = recorded.lastCommit ?? null;
    const incomplete = recordedIncomplete(recorded, skill);
    const gitlink = gitlinkMeta(discovered, branch, modules);
    const isScript = discovered.kind === 'script';
    const scriptFiles = discovered.scriptFiles
      ? Object.values(discovered.scriptFiles).filter(Boolean)
      : [];
    const pathExists = isScript
      ? scriptFiles.some((f) => existsSync(join(ROOT, f)))
      : existsSync(join(ROOT, discovered.path)) || Boolean(gitlink?.pinnedSha);
    let status = 'needs-run';
    let reason = 'never-run';
    let files = [];

    if (gitlink && !gitlink.pinnedSha) {
      status = 'skipped';
      reason = 'missing-gitlink';
    } else if (!pathExists) {
      status = 'skipped';
      reason = 'missing-path';
    } else if (isScript) {
      files = changedFiles(lastCommit, head, scriptDiffPaths(discovered));
      if (opts.force) {
        reason = 'force';
        if (!files.length) files = scriptFiles.filter((f) => existsSync(join(ROOT, f)));
      } else if (discovered.converted) {
        status = 'up-to-date';
        reason = discovered.convertReason || 'already-node';
      } else if (!lastCommit) {
        reason = discovered.convertReason || 'never-run';
      } else if (!commitExists(lastCommit)) {
        reason = 'unknown-last-commit';
      } else if (files.length) {
        reason = 'git-diff';
      } else {
        status = 'up-to-date';
        reason = 'no-diff';
      }
    } else if (opts.force) {
      reason = 'force';
      files = changedFiles(lastCommit, head, discovered.path);
    } else if (!lastCommit) {
      reason = 'never-run';
    } else if (!commitExists(lastCommit)) {
      reason = 'unknown-last-commit';
    } else {
      files = changedFiles(lastCommit, head, discovered.path);
      if (files.length) {
        reason = 'git-diff';
      } else if (incomplete.length) {
        reason = incompleteReason(skill);
      } else {
        status = 'up-to-date';
        reason = 'no-diff';
      }
    }

    const name = agentName(skillId, discovered.id);
    const entry = {
      id: discovered.id,
      skill: skillId,
      kind: discovered.kind,
      workflow: discovered.workflow,
      path: discovered.path,
      agentName: name,
      worktreeBranch: name,
      baseBranch: branch,
      lastCommit,
      status,
      reason,
      changedFiles: files.slice(0, MAX_CHANGED_FILES),
      changedFileCount: files.length,
    };
    if (isScript) {
      entry.stem = discovered.stem;
      entry.dir = discovered.dir;
      entry.scriptFiles = discovered.scriptFiles;
    }
    if (gitlink) entry.gitlink = gitlink;
    const key = incompleteKey(skill);
    if (key) entry[key] = incomplete;
    apps.push(entry);
  }

  const needsRun = apps.filter((a) => a.status === 'needs-run');
  const maxLaunch = maxLaunchOf(config);
  const launchNow = needsRun.slice(0, maxLaunch);
  const deferred = needsRun.slice(maxLaunch);

  return {
    skill: skillId,
    kind: 'atomic',
    cohort: skill.cohort,
    steps: skillSteps(skill),
    baseBranch: branch,
    head,
    lastRunsPath: skill.lastRunsPath,
    force: Boolean(opts.force),
    maxLaunch,
    apps,
    needsRun: needsRun.map((a) => a.id),
    launchNow: launchNow.map((a) => a.id),
    deferred: deferred.map((a) => a.id),
    upToDate: apps.filter((a) => a.status === 'up-to-date').map((a) => a.id),
    skipped: apps.filter((a) => a.status === 'skipped').map((a) => a.id),
  };
}

function planUmbrella(skillId, opts, config) {
  const skill = resolveSkill(config, skillId);
  if (!Array.isArray(skill.waves) || !skill.waves.length) {
    throw new Error(`umbrella '${skillId}' requires a non-empty waves array`);
  }
  const branch = resolveBaseBranch(opts);
  const head = resolveBaseSha(branch);
  const maxLaunch = maxLaunchOf(config);
  const waveFilter = Number.isInteger(opts.wave) ? opts.wave : null;

  const waves = skill.waves
    .map((wave, index) => {
      if (waveFilter !== null && index !== waveFilter) return null;
      if (!Array.isArray(wave.skills) || !wave.skills.length) {
        throw new Error(`umbrella wave ${index} needs a skills array`);
      }
      const nestedApps = [];
      for (const nestedId of wave.skills) {
        const nested = planAtomic(nestedId, opts, config);
        for (const app of nested.apps) {
          nestedApps.push({
            ...app,
            skill: nestedId,
            steps: nested.steps,
            lastRunsPath: nested.lastRunsPath,
          });
        }
      }
      const needsRun = nestedApps.filter((a) => a.status === 'needs-run');
      const launchNow = needsRun.slice(0, maxLaunch);
      const deferred = needsRun.slice(maxLaunch);
      return {
        index,
        step: wave.step,
        skills: wave.skills,
        apps: nestedApps,
        needsRun: needsRun.map((a) => a.agentName),
        launchNow: launchNow.map((a) => {
          const row = {
            skill: a.skill,
            id: a.id,
            agentName: a.agentName,
            worktreeBranch: a.worktreeBranch,
            baseBranch: a.baseBranch ?? branch,
            path: a.path,
            gitlink: a.gitlink ?? null,
          };
          if (a.stem) {
            row.stem = a.stem;
            row.dir = a.dir;
            row.scriptFiles = a.scriptFiles;
          }
          return row;
        }),
        deferred: deferred.map((a) => a.agentName),
        upToDate: nestedApps.filter((a) => a.status === 'up-to-date').map((a) => a.agentName),
        skipped: nestedApps.filter((a) => a.status === 'skipped').map((a) => a.agentName),
      };
    })
    .filter(Boolean);

  return {
    skill: skillId,
    kind: 'umbrella',
    userInvokedOnly: true,
    cohort: skill.cohort ?? 'all',
    steps: skill.waves.map((w) => w.step),
    baseBranch: branch,
    head,
    force: Boolean(opts.force),
    maxLaunch,
    waves,
  };
}

function plan(skillId, opts, config) {
  const skill = resolveSkill(config, skillId);
  if (isUmbrella(skill)) return planUmbrella(skillId, opts, config);
  return planAtomic(skillId, opts, config);
}

function listSkills(config) {
  const maxLaunch = maxLaunchOf(config);
  const skills = Object.entries(config.skills).map(([id, skill]) => {
    if (isUmbrella(skill)) {
      return {
        id,
        kind: 'umbrella',
        userInvokedOnly: true,
        cohort: skill.cohort ?? 'all',
        steps: (skill.waves ?? []).map((w) => w.step),
        waves: skill.waves ?? [],
      };
    }
    return {
      id,
      kind: 'atomic',
      cohort: skill.cohort,
      discover: skill.discover,
      steps: skillSteps(skill),
      lastRunsPath: skill.lastRunsPath,
      incompleteField: skill.incompleteField ?? null,
    };
  });
  return { maxLaunch, baseBranch: resolveBaseBranch(), skills };
}

function resolveCommit(ref) {
  const sha = git(['rev-parse', '--verify', `${ref}^{commit}`], { allowFail: true });
  if (!sha) {
    throw new Error(`commit ${ref} is not in this repository`);
  }
  return sha;
}

function parseCsv(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function record(skillId, ids, opts, config) {
  if (!ids.length) usage();
  const skill = resolveSkill(config, skillId);
  if (isUmbrella(skill)) {
    throw new Error('record each nested skill, not platform-quality');
  }
  const sha = resolveCommit(opts.commit || resolveBaseBranch(opts));
  const discovered = new Map(discover(skill).map((a) => [a.id, a]));
  const lastRuns = loadLastRuns(skill);
  const beforeApps = structuredClone(lastRuns.apps);
  const recordedAt = new Date().toISOString();
  const key = incompleteKey(skill);
  const items =
    key === 'incompletePages'
      ? parseCsv(opts.incompletePages)
      : key === 'incompleteFiles'
        ? parseCsv(opts.incompleteFiles)
        : [];

  for (const id of ids) {
    const app = discovered.get(id);
    if (!app) {
      throw new Error(unknownIdMessage(skill, id));
    }
    const entry = {
      path: app.path,
      lastCommit: sha,
      recordedAt,
    };
    if (key) entry[key] = items;
    lastRuns.apps[id] = entry;
  }

  const dest = lastRunsPath(skill);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(lastRuns, null, 2)}\n`, 'utf8');
  const lastRunsCommit = commitLastRunsIfNeeded({
    beforeApps,
    afterApps: lastRuns.apps,
    ids,
    skillId,
    relPath: posix(skill.lastRunsPath),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true }),
    runGit: (args, options) => git(args, options),
  });
  const result = {
    skill: skillId,
    lastRunsPath: skill.lastRunsPath,
    commit: sha,
    ids,
    lastRunsCommitted: lastRunsCommit.committed,
  };
  if (lastRunsCommit.message) result.lastRunsMessage = lastRunsCommit.message;
  if (lastRunsCommit.commit) result.lastRunsCommit = lastRunsCommit.commit;
  if (key) result[key] = items;
  return result;
}

function closeHelpers() {
  return {
    removeDir: (p) => rmSync(p, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 }),
    exists: (p) => existsSync(p),
  };
}

function closeHere() {
  const here = process.cwd();
  const listPorcelain = gitAt(here, ['worktree', 'list', '--porcelain']);
  const listed = parseWorktreeList(listPorcelain);
  const primaryPath = listed[0]?.path;
  if (!primaryPath) {
    throw new Error('cannot resolve the primary checkout from this directory');
  }
  return closeOpenedWorktrees({
    here,
    deleteBranch: false,
    primaryPath,
    listPorcelain,
    runGit: (args, options) => gitAt(primaryPath, args, options),
    ...closeHelpers(),
  });
}

function gitAt(dir, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFail) return '';
    const detail = err.stderr?.toString().trim() || err.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function closeSkill(skillId, ids, opts, config) {
  if (!opts.baseWorktree && (!skillId || !ids.length)) usage();
  const listPorcelain = git(['worktree', 'list', '--porcelain']);
  const listed = parseWorktreeList(listPorcelain);
  const primaryPath = listed[0]?.path || ROOT;
  const branches = [];
  const cloneDirs = [];
  if (skillId && ids.length) {
    const skill = resolveSkill(config, skillId);
    if (isUmbrella(skill)) {
      throw new Error('close each nested skill, not platform-quality');
    }
    const discovered = new Map(discover(skill).map((a) => [a.id, a]));
    for (const id of ids) {
      const app = discovered.get(id);
      if (!app) throw new Error(unknownIdMessage(skill, id));
      branches.push(agentName(skillId, id));
      if (app.gitlink) cloneDirs.push(posix(`.worktrees/gitlinks/${id}`));
    }
  }
  return closeOpenedWorktrees({
    branches,
    cloneDirs,
    baseWorktree: opts.baseWorktree ? resolveBaseBranch(opts) : null,
    deleteBranch: true,
    primaryPath,
    listPorcelain,
    runGit: (args, options) => git(args, options),
    ...closeHelpers(),
  });
}

function parseArgs(argv) {
  const positional = [];
  const opts = {
    skill: null,
    apps: [],
    force: false,
    commit: null,
    incompletePages: null,
    incompleteFiles: null,
    wave: null,
    base: null,
    here: false,
    baseWorktree: false,
    ids: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') opts.force = true;
    else if (arg === '--skill') opts.skill = argv[++i];
    else if (arg === '--app') opts.apps.push(argv[++i]);
    else if (arg === '--commit') opts.commit = argv[++i];
    else if (arg === '--incomplete-pages') opts.incompletePages = argv[++i];
    else if (arg === '--incomplete-files') opts.incompleteFiles = argv[++i];
    else if (arg === '--here') opts.here = true;
    else if (arg === '--base-worktree') opts.baseWorktree = true;
    else if (arg === '--wave') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 0) usage();
      opts.wave = n;
    } else if (arg === '--base') opts.base = argv[++i];
    else if (arg === '--help' || arg === '-h') usage(0);
    else if (arg.startsWith('-')) usage();
    else positional.push(arg);
  }
  const cmd = positional[0];
  opts.ids = positional.slice(1);
  return { cmd, opts };
}

const { cmd, opts } = parseArgs(process.argv.slice(2));
try {
  const config = loadConfig();
  if (cmd === 'list') {
    const result = listSkills(config);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (cmd === 'plan') {
    const result = plan(opts.skill, opts, config);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (cmd === 'record') {
    const result = record(opts.skill, opts.ids, opts, config);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (cmd === 'close') {
    const result = opts.here ? closeHere() : closeSkill(opts.skill, opts.ids, opts, config);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    usage(cmd ? 1 : 0);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
