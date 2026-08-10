#!/usr/bin/env node
/**
 * Type-error ratchet.
 *
 * `astro check` reports 617 errors, almost all of them untyped DOM queries in
 * inline <script> blocks that predate this file. Gating CI on zero meant CI never
 * got past the type check — Build and Run Tests had never executed on any push or
 * pull request, so the whole test suite was decorative. Gating on "no worse than
 * last time" restores the parts of CI that actually catch regressions, while still
 * refusing new errors.
 *
 * The baseline lives in type-errors.json and is meant to fall. When it does, this
 * prints the new number; commit it and the floor drops.
 *
 *   node scripts/check-ratchet.mjs            check against the baseline
 *   node scripts/check-ratchet.mjs --update   write the current count as the baseline
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineFile = join(root, 'type-errors.json');

// astro check paints its output; strip SGR sequences before matching.
const stripAnsi = (s) => s.replace(/\[[0-9;]*m/g, '');

const run = () => {
    // One command string rather than an args array: `shell: true` is needed to find
    // npx on Windows, and passing args alongside it trips Node's DEP0190 warning.
    const res = spawnSync('npx astro check', {
        cwd: root,
        encoding: 'utf8',
        shell: true,
        maxBuffer: 64 * 1024 * 1024
    });
    // Exit code is 1 whenever errors > 0, so it tells us nothing here. The summary
    // line is the signal.
    return stripAnsi(`${res.stdout || ''}${res.stderr || ''}`);
};

const output = run();
const match = output.match(/^-\s+(\d+)\s+errors?$/m);

if (!match) {
    // A crashed or reformatted `astro check` must not read as "zero errors" — that
    // would silently disable the ratchet.
    console.error('check-ratchet: could not find the error summary in astro check output.');
    console.error('Last 40 lines:\n');
    console.error(output.trim().split('\n').slice(-40).join('\n'));
    process.exit(2);
}

const actual = Number(match[1]);

if (process.argv.includes('--update')) {
    writeFileSync(baselineFile, `${JSON.stringify({ errors: actual }, null, 2)}\n`);
    console.log(`check-ratchet: baseline written at ${actual} errors.`);
    process.exit(0);
}

let baseline;
try {
    baseline = JSON.parse(readFileSync(baselineFile, 'utf8')).errors;
} catch {
    console.error(`check-ratchet: no readable baseline at ${baselineFile}.`);
    console.error('Create one with: node scripts/check-ratchet.mjs --update');
    process.exit(2);
}

if (actual > baseline) {
    console.error(`\ncheck-ratchet: ${actual} type errors, up from ${baseline} (+${actual - baseline}).\n`);

    // Name the files, so the failure is actionable without re-running anything.
    const perFile = {};
    for (const line of output.split('\n')) {
        const m = line.match(/^(src\/[^:]+):\d+:\d+ - error/);
        if (m) perFile[m[1]] = (perFile[m[1]] || 0) + 1;
    }
    const worst = Object.entries(perFile).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (worst.length) {
        console.error('Errors by file (top 10):');
        for (const [file, n] of worst) console.error(`  ${String(n).padStart(4)}  ${file}`);
    }

    console.error('\nRun `npx astro check` for the detail. New errors are not accepted;');
    console.error('fix them, or explain in the PR why the baseline should rise.');
    process.exit(1);
}

if (actual < baseline) {
    console.log(`check-ratchet: ${actual} type errors, down from ${baseline} (-${baseline - actual}). `
        + 'Lower the floor with: node scripts/check-ratchet.mjs --update');
    process.exit(0);
}

console.log(`check-ratchet: ${actual} type errors, unchanged.`);
