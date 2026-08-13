#!/usr/bin/env node
/**
 * Builds the JupyterLite research lab into public/research/.
 *
 * /research/lab/index.html is linked from both exchange-rate-dynamics project pages
 * and the search index, but public/research/ is gitignored and was only ever built
 * inside .github/workflows/deploy.yml — which publishes to GitHub Pages. Vercel
 * builds from git, never saw it, and the lab 404'd in production.
 *
 * Replaces the `xcopy` in the old `build:lab` script, which is Windows-only and
 * cannot run on Vercel's Linux image.
 *
 * Two deliberate properties:
 *
 *   - Opt-in. Installing jupyterlite plus pandas, scipy and matplotlib is a real
 *     cost on every deploy, so this only runs when BUILD_LAB is set.
 *   - Fails soft. A broken Python toolchain must not take the whole site down; it
 *     logs and exits 0, leaving the lab absent exactly as it is today.
 */
import { spawnSync } from 'node:child_process';
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const notebooks = join(root, 'notebooks');
const output = join(notebooks, '_output');
const target = join(root, 'public', 'research');

const log = (msg) => console.log(`[build-lab] ${msg}`);

/** Non-fatal exit: the site build continues without the lab. */
function bail(reason) {
    log(`skipping — ${reason}`);
    log('/research will 404 until this succeeds. This is not a build failure.');
    process.exit(0);
}

if (!process.env.BUILD_LAB) {
    bail('BUILD_LAB is not set');
}

if (!existsSync(notebooks)) {
    bail(`no notebooks directory at ${notebooks}`);
}

// Prefer an explicit interpreter, then the usual names.
const python = process.env.PYTHON_BIN || 'python3';

/**
 * `shell` is needed on Windows to resolve `python` from PATH, but it also breaks any
 * command whose path contains a space — process.execPath is
 * "C:\Program Files\nodejs\node.exe" — and passing an args array alongside it trips
 * Node's DEP0190. So: shell only when resolving a bare command name, and then as one
 * pre-quoted string.
 */
const run = (cmd, args, cwd) => {
    log(`$ ${cmd} ${args.join(' ')}`);

    const needsShell = process.platform === 'win32' && !cmd.includes('\\') && !cmd.includes('/');
    if (needsShell) {
        const quoted = [cmd, ...args].map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ');
        return spawnSync(quoted, { cwd, stdio: 'inherit', shell: true });
    }

    return spawnSync(cmd, args, { cwd, stdio: 'inherit' });
};

const probe = run(python, ['--version'], root);
if (probe.status !== 0) {
    bail(`no working Python at "${python}" (set PYTHON_BIN to override)`);
}

const deps = run(python, ['-m', 'pip', 'install', '-r', 'requirements.txt'], notebooks);
if (deps.status !== 0) {
    bail('pip install failed');
}

// jupyterlite uses doit, which caches task state. A stale _output makes it skip
// `init:static:unpack` and emit a shell with no application assets at all — the lab
// page then loads and immediately 404s on its own bundle. Always start clean.
await rm(output, { recursive: true, force: true });
await rm(join(notebooks, '.jupyterlite.doit.db'), { force: true });

const built = run(python, ['-m', 'jupyterlite', 'build', '--config', 'jupyter_lite_config.json'], notebooks);
if (built.status !== 0) {
    bail('jupyterlite build failed');
}

if (!existsSync(output)) {
    bail(`jupyterlite reported success but produced no ${output}`);
}

// Replace rather than merge, so a stale build cannot linger.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(output, target, { recursive: true });
log(`copied ${output} -> ${target}`);

const patched = run(process.execPath, [join('scripts', 'patch-lab-config.mjs')], root);
if (patched.status !== 0) {
    bail('patch-lab-config.mjs failed');
}

log('lab built at /research');
