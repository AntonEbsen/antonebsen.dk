/**
 * The group's shared Zotero library.
 *
 * https://www.zotero.org/groups/5801880/treenigheden — Anton, Jonas and Sheng's
 * reading for the joint papers. Unlike ResearchGate, Academia.edu, SSRN and Google
 * Scholar, this one has a real public API: no key, no quota, and a documented
 * versioning scheme. It is the only source since ORCID that can honestly be synced.
 *
 * The point is not that the site gains a bibliography — /team already had one, typed
 * by hand. The point is that the typed one will drift and this one cannot, because
 * all three of them maintain it as they work.
 *
 * Read-only, deliberately. The API supports writes with a key, but the library
 * belongs to three people and a script pushing into it would be editing someone
 * else's work.
 */

import { z } from 'zod';

// --- Constants ---

export const ZOTERO_GROUP_ID = '5801880';
export const ZOTERO_GROUP_URL = `https://www.zotero.org/groups/${ZOTERO_GROUP_ID}/treenigheden`;

/**
 * `/items/top` rather than `/items`: the library holds 26 records but only 11 works.
 * The rest are attachments and notes hanging off them, which `top` already excludes.
 */
export const ZOTERO_API_URL = `https://api.zotero.org/groups/${ZOTERO_GROUP_ID}/items/top`;

// --- Schema ---

const ItemSchema = z.object({
    /** Zotero's own key, stable across edits — used to keep ordering deterministic. */
    key: z.string().min(1),
    title: z.string().min(1),
    /** Last names only; the shared library is a reading list, not a citation style. */
    creators: z.array(z.string()),
    /** Free-form in Zotero: "2016/09", "1999-12-03" and "2018" all occur. */
    date: z.string().optional(),
    itemType: z.string(),
    /** Journal, publisher or repository, whichever the item type carries. */
    publication: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
});

const LibrarySchema = z.object({
    groupId: z.string(),
    url: z.string(),
    fetchedAt: z.string(),
    /** Zotero's Last-Modified-Version, so an unchanged library is cheap to detect. */
    version: z.number(),
    items: z.array(ItemSchema),
});

export type ZoteroItem = z.infer<typeof ItemSchema>;
export type ZoteroLibrary = z.infer<typeof LibrarySchema>;

// --- Parsing ---

type Json = Record<string, any>;

/**
 * A creator is either `{ firstName, lastName }` or `{ name }` for institutional
 * authors. Both appear in this library.
 */
function creatorName(creator: Json): string | undefined {
    const last = creator?.lastName?.trim();
    if (last) return last;
    const single = creator?.name?.trim();
    return single || undefined;
}

/**
 * The year, from Zotero's deliberately loose date field.
 *
 * Zotero stores whatever the source gave it — "2016/09", "1999-12-03", "2018",
 * "n.d." — so this reads the first four-digit run rather than trying to parse a
 * date. Same approach as `startYear` in src/lib/orcid.ts, and for the same reason.
 */
export function itemYear(date: string | undefined): string | undefined {
    return date?.match(/\d{4}/)?.[0];
}

/**
 * A bare DOI, whatever the contributor pasted.
 *
 * Zotero's DOI field is free text, and this library holds both forms: four items
 * store `10.3386/w21812` and two store `https://doi.org/10.1016/…`. Rendering the
 * second behind a `https://doi.org/` prefix produced
 * `https://doi.org/https://doi.org/10.1016/…`, which resolves to nothing.
 *
 * Normalised here rather than in the template so every consumer gets the same shape
 * — the alternative is each render site remembering to strip it.
 */
export function bareDoi(doi: string | undefined): string | undefined {
    if (!doi) return undefined;
    const stripped = doi
        .trim()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
        .replace(/^doi:\s*/i, '');
    return stripped || undefined;
}

/**
 * Project the `/items/top` response into the shape we commit.
 *
 * Exported separately from the fetch so the test can run it against a fixture with
 * no network — the same split as `parseFeed` in youtube.ts and `parseRecord` in
 * orcid.ts.
 */
export function parseItems(json: Json[]): ZoteroItem[] {
    const items: ZoteroItem[] = [];

    for (const entry of json ?? []) {
        const d: Json = entry?.data ?? {};

        // Belt and braces: /items/top already excludes these, but a note or an
        // attachment reaching the page would render as a titleless row.
        if (d.itemType === 'attachment' || d.itemType === 'note') continue;

        const parsed = ItemSchema.safeParse({
            key: d.key,
            title: typeof d.title === 'string' ? d.title.trim() : undefined,
            creators: (d.creators ?? []).map(creatorName).filter(Boolean),
            date: d.date || undefined,
            itemType: d.itemType,
            publication: d.publicationTitle || d.publisher || d.repository || undefined,
            doi: bareDoi(d.DOI),
            url: d.url || undefined,
        });

        if (!parsed.success) {
            console.warn('Skipping malformed Zotero item:', parsed.error.flatten());
            continue;
        }
        items.push(parsed.data);
    }

    return items;
}

// --- Fetch ---

/**
 * Read the live library. Only the sync script calls this; the site reads the
 * committed snapshot.
 *
 * Throws on failure. A hand-run sync should stop and say so rather than quietly
 * writing a thinner library over a good one — and if the group is ever made private
 * this is where that shows up.
 */
export async function fetchLibrary(fetchedAt = new Date().toISOString().slice(0, 10)): Promise<ZoteroLibrary> {
    // GET, not HEAD: the API answers HEAD with 405 and `Allow: GET`.
    const response = await fetch(`${ZOTERO_API_URL}?format=json&limit=100`, {
        headers: { 'Zotero-API-Version': '3', 'User-Agent': 'antonebsen.dk sync' },
        signal: AbortSignal.timeout(15000),
    });

    // Zotero asks clients to stand down when it says so. This is a hand-run script
    // against a free service, so it obeys rather than retrying into a rate limit.
    const backoff = response.headers.get('Backoff') ?? response.headers.get('Retry-After');
    if (backoff) {
        throw new Error(`Zotero asked for a ${backoff}s backoff; try again after that.`);
    }

    if (!response.ok) {
        throw new Error(`Zotero returned ${response.status} ${response.statusText}`);
    }

    return LibrarySchema.parse({
        groupId: ZOTERO_GROUP_ID,
        url: ZOTERO_GROUP_URL,
        fetchedAt,
        version: Number(response.headers.get('Last-Modified-Version') ?? 0),
        items: parseItems(await response.json()),
    });
}

// --- The committed snapshot ---

import snapshot from '../data/zotero.json';

/** What the site renders. Refresh with `npm run sync:zotero`. */
export const library: ZoteroLibrary = LibrarySchema.parse(snapshot);
