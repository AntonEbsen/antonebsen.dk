#!/usr/bin/env node
/**
 * Refresh the committed snapshot of the group's shared Zotero library.
 *
 *   npm run sync:zotero
 *
 * Same shape as sync-orcid.mjs, and for the same reasons: not part of `build`, so a
 * build never depends on api.zotero.org being up, and every change to the library
 * arrives as a reviewable diff rather than appearing silently in production.
 *
 * The fetch and the parse live in src/lib/zotero.ts so the site, the unit test and
 * this script agree on the shape by construction. Vite's SSR loader is how a plain
 * node script reaches a .ts file on Node 20 — see the longer note in sync-orcid.mjs.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src', 'data', 'zotero.json');

const server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    server: { middlewareMode: true },
    appType: 'custom',
});

let library;
try {
    // zotero.ts imports the snapshot it is about to write, so on a first run the
    // file has to exist before the module loads. An empty library parses fine.
    if (!existsSync(target)) {
        const seed = { groupId: '5801880', url: '', fetchedAt: '1970-01-01', version: 0, items: [] };
        writeFileSync(target, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
    }
    const { fetchLibrary } = await server.ssrLoadModule('/src/lib/zotero.ts');
    library = await fetchLibrary();
} finally {
    await server.close();
}

// fetchedAt moves on every run, so comparing the serialised file directly would
// report a diff for an untouched library. Compare everything else.
const withoutTimestamp = ({ fetchedAt, ...rest }) => JSON.stringify(rest);
const previous = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : null;
const changed = !previous || withoutTimestamp(previous) !== withoutTimestamp(library);

if (!changed) {
    library.fetchedAt = previous.fetchedAt;
}

writeFileSync(target, `${JSON.stringify(library, null, 2)}\n`, 'utf8');

console.log(`${changed ? 'Updated' : 'Unchanged'}: src/data/zotero.json  (v${library.version})`);
console.log(`  items: ${library.items.length}`);

const byType = {};
for (const item of library.items) byType[item.itemType] = (byType[item.itemType] ?? 0) + 1;
for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)} ${type}`);
}

const withDoi = library.items.filter((i) => i.doi).length;
console.log(`  with a DOI: ${withDoi} of ${library.items.length}`);
