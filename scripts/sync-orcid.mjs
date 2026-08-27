#!/usr/bin/env node
/**
 * Refresh the committed ORCID snapshot.
 *
 *   npm run sync:orcid
 *
 * Deliberately not part of `build`. The record changes a few times a year, the
 * public API is the only copy, and a build that reaches out to orcid.org is a build
 * that fails when orcid.org does. Running this by hand means every change to the
 * profile arrives as a reviewable diff instead of appearing silently in production.
 *
 * The fetch and the parse live in src/lib/orcid.ts, so the site, the unit test and
 * this script all agree on the shape by construction. Getting at a .ts file from a
 * plain node script is the awkward part: `engines` allows Node 20, which cannot
 * strip types, so importing it directly would break for anyone not on 23+. Vite is
 * already here as an Astro dependency and its SSR loader handles TypeScript on
 * every supported version, which beats adding a loader dependency for one script.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'src', 'data', 'orcid.json');

const server = await createServer({
    root,
    // Astro's config would pull in the whole integration chain — adapters, Sentry,
    // the sitemap — to load one module that imports nothing but zod.
    configFile: false,
    logLevel: 'warn',
    server: { middlewareMode: true },
    appType: 'custom',
});

let record;
try {
    const { fetchRecord } = await server.ssrLoadModule('/src/lib/orcid.ts');
    record = await fetchRecord();
} finally {
    await server.close();
}

// fetchedAt changes on every run, so comparing the serialised file directly would
// report a diff even when the record is untouched. Compare everything else.
const withoutTimestamp = ({ fetchedAt, ...rest }) => JSON.stringify(rest);
const previous = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : null;
const changed = !previous || withoutTimestamp(previous) !== withoutTimestamp(record);

if (!changed) {
    // Keep the old timestamp so an unchanged record leaves the working tree clean.
    record.fetchedAt = previous.fetchedAt;
}

writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

console.log(`${changed ? 'Updated' : 'Unchanged'}: src/data/orcid.json  (${record.uri})`);
console.log(`  affiliations: ${record.affiliations.length}`);
for (const a of record.affiliations) {
    console.log(`    - [${a.kind}] ${a.role} — ${a.organization} (${a.start ?? '?'} -> ${a.end ?? 'ongoing'})`);
}
console.log(`  researcher URLs: ${record.urls.length}`);
console.log(`  works: ${record.works.length}`);

if (record.works.length === 0) {
    console.log('\n  No works on the record, so the publications section stays hidden.');
    console.log('  Depositing something with Zenodo mints a DOI, which populates ORCID,');
    console.log('  which lands here on the next sync.');
}
