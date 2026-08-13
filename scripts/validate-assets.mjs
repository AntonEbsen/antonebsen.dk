#!/usr/bin/env node
/**
 * Missing-asset ratchet.
 *
 * Pages on this site were written before their figures, slide decks and PDFs
 * existed, and most of those files were never produced. At one point 22 of the 28
 * assets referenced by project pages 404'd, including the download button on the
 * bachelor thesis and a "Download PDF" in the footer of every page.
 *
 * The templates now hide an asset that is not in public/ (see src/lib/public-asset.ts),
 * so none of them render any more. This script tracks the other half of the problem:
 * the references still sitting in source, waiting for someone to produce the file.
 * That list is a to-do, not a defect — so, like the type-error ratchet, it fails only
 * when the number goes *up*. Add a page that points at a figure you have not drawn
 * yet and CI says so; drop the real file into public/ and the floor comes down.
 *
 *   node scripts/validate-assets.mjs            check against the baseline
 *   node scripts/validate-assets.mjs --list     print everything still missing
 *   node scripts/validate-assets.mjs --update   write the current count as the baseline
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselineFile = join(root, 'missing-assets.json');
const publicDir = join(root, 'public');

// Directories worth searching. node_modules and .astro are noise; public/ is the
// answer, not the question.
const SEARCH_DIRS = ['src'];
const EXTENSIONS = ['.astro', '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx'];

const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            if (name === 'node_modules' || name.startsWith('.')) continue;
            walk(full, out);
        } else if (EXTENSIONS.some(ext => name.endsWith(ext))) {
            out.push(full);
        }
    }
    return out;
};

// A quoted string that starts /assets/. Deliberately narrow: interpolated paths
// (`/assets/${slug}.png`) cannot be resolved without running the code, and guessing
// at them would produce false failures that teach people to ignore this script.
const ASSET_RE = /["'`](\/assets\/[^"'`\s${}]+)["'`]/g;

const missing = new Map(); // asset url -> Set of source files

for (const dir of SEARCH_DIRS) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const file of walk(abs)) {
        const text = readFileSync(file, 'utf8');
        for (const [, url] of text.matchAll(ASSET_RE)) {
            const clean = url.split(/[?#]/)[0];
            // "/assets/img/..." in prose is someone describing a path, not using one.
            if (clean.includes('...')) continue;
            if (existsSync(join(publicDir, decodeURIComponent(clean)))) continue;
            if (!missing.has(clean)) missing.set(clean, new Set());
            missing.get(clean).add(relative(root, file).split(sep).join('/'));
        }
    }
}

const actual = missing.size;
const report = () => {
    for (const [url, files] of [...missing].sort()) {
        console.error(`  ${url}`);
        for (const f of [...files].sort()) console.error(`      ${f}`);
    }
};

if (process.argv.includes('--list')) {
    console.log(`validate-assets: ${actual} referenced assets are missing from public/.\n`);
    report();
    process.exit(0);
}

if (process.argv.includes('--update')) {
    writeFileSync(baselineFile, `${JSON.stringify({ missing: actual }, null, 2)}\n`);
    console.log(`validate-assets: baseline written at ${actual} missing assets.`);
    process.exit(0);
}

let baseline;
try {
    baseline = JSON.parse(readFileSync(baselineFile, 'utf8')).missing;
} catch {
    console.error(`validate-assets: no readable baseline at ${baselineFile}.`);
    console.error('Create one with: node scripts/validate-assets.mjs --update');
    process.exit(2);
}

if (actual > baseline) {
    console.error(`\nvalidate-assets: ${actual} referenced assets are missing from public/, `
        + `up from ${baseline} (+${actual - baseline}).\n`);
    report();
    console.error('\nEither add the file to public/, or remove the reference. New missing');
    console.error('assets are not accepted, even though the existing ones are tolerated.');
    process.exit(1);
}

if (actual < baseline) {
    console.log(`validate-assets: ${actual} missing assets, down from ${baseline} (-${baseline - actual}). `
        + 'Lower the floor with: node scripts/validate-assets.mjs --update');
    process.exit(0);
}

console.log(`validate-assets: ${actual} missing assets, unchanged.`);
