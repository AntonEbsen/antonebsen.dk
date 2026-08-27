/**
 * The public ORCID record, and the rules for reconciling it with the CV.
 *
 * ORCID is a verification layer here, not a content source. The site's own
 * /education page carries thesis topics, course lists and completion figures that
 * the record does not have, so nothing below renders ORCID's affiliation data in
 * place of ours. What the record uniquely provides is a third party that can
 * confirm the claims — which is why the interesting export in this file is not the
 * parser but the reconciliation helpers underneath it, used by orcid.test.ts to
 * fail the build when the CV and the record drift apart.
 *
 * The snapshot in src/data/orcid.json is committed rather than fetched during the
 * build. src/lib/youtube.ts fetches live because a missing feed degrades to the
 * curated video collection — an empty array is survivable there. Here the record
 * *is* the data, so a fetch failure has nothing to fall back to. Committing it also
 * makes every change to the profile show up in a diff, and keeps ORCID out of the
 * CSP connect-src allowlists, which live in two places (vercel.json and
 * src/middleware.ts) and already disagree with each other.
 */

import { z } from 'zod';
import snapshot from '../data/orcid.json';

// --- Record constants ---

export const ORCID_ID = '0009-0006-4129-8044';
export const ORCID_URI = `https://orcid.org/${ORCID_ID}`;

/** The public API. No token, no quota, no env var. */
export const ORCID_API_URL = `https://pub.orcid.org/v3.0/${ORCID_ID}/record`;

/** Research Organization Registry id for the University of Copenhagen. */
export const UCPH_ROR = 'https://ror.org/035b05819';

// --- Schema ---

const AffiliationSchema = z.object({
    kind: z.enum(['education', 'employment']),
    role: z.string().min(1),
    department: z.string().optional(),
    organization: z.string().min(1),
    ror: z.string().optional(),
    /** `YYYY`, `YYYY-MM` or `YYYY-MM-DD` — ORCID lets a contributor omit the finer parts. */
    start: z.string().optional(),
    /** Absent means ongoing. */
    end: z.string().optional(),
});

const WorkSchema = z.object({
    putCode: z.number(),
    title: z.string().min(1),
    type: z.string().optional(),
    date: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
    journal: z.string().optional(),
});

const RecordSchema = z.object({
    orcid: z.string(),
    uri: z.string(),
    fetchedAt: z.string(),
    name: z.string(),
    urls: z.array(z.object({ name: z.string(), url: z.string() })),
    affiliations: z.array(AffiliationSchema),
    works: z.array(WorkSchema),
});

export type OrcidAffiliation = z.infer<typeof AffiliationSchema>;
export type OrcidWork = z.infer<typeof WorkSchema>;
export type OrcidRecord = z.infer<typeof RecordSchema>;

// --- Parsing ---

type Json = Record<string, any>;

/**
 * ORCID dates are `{ year: { value }, month: { value }, day: { value } }`, and any
 * of the three can be null. Rendering "2021-null-null" would be worse than a bare
 * year, so each part is only appended once the one before it is present.
 */
function isoDate(date: Json | null | undefined): string | undefined {
    const year = date?.year?.value;
    if (!year) return undefined;
    const month = date?.month?.value;
    if (!month) return String(year);
    const day = date?.day?.value;
    return day ? `${year}-${month}-${day}` : `${year}-${month}`;
}

/**
 * Affiliations arrive two levels deep: a list of groups, each holding summaries of
 * the same post as asserted by different sources. One contributor-entered record
 * means one summary per group, but the shape allows for more, so every summary is
 * taken rather than just the first.
 */
function flattenAffiliations(section: Json | undefined, kind: OrcidAffiliation['kind']): OrcidAffiliation[] {
    const groups: Json[] = section?.['affiliation-group'] ?? [];
    const key = `${kind}-summary`;

    return groups.flatMap((group) =>
        (group.summaries ?? []).flatMap((entry: Json) => {
            const summary = entry[key];
            if (!summary?.organization?.name) return [];

            const disambiguated = summary.organization['disambiguated-organization'];
            const ror =
                disambiguated?.['disambiguation-source'] === 'ROR'
                    ? disambiguated['disambiguated-organization-identifier']
                    : undefined;

            return [{
                kind,
                role: summary['role-title'] ?? '',
                department: summary['department-name'] ?? undefined,
                organization: summary.organization.name,
                ror,
                start: isoDate(summary['start-date']),
                end: isoDate(summary['end-date']),
            }];
        }),
    );
}

function flattenWorks(section: Json | undefined): OrcidWork[] {
    const groups: Json[] = section?.group ?? [];

    return groups.flatMap((group) => {
        // A group collects the same work as reported by several sources; the first
        // summary is the preferred one.
        const summary: Json | undefined = group['work-summary']?.[0];
        if (!summary) return [];

        const ids: Json[] = summary['external-ids']?.['external-id'] ?? [];
        const doi = ids.find((id) => id['external-id-type'] === 'doi')?.['external-id-value'];
        const resolved = ids.find((id) => id['external-id-url']?.value)?.['external-id-url']?.value;

        const parsed = WorkSchema.safeParse({
            putCode: summary['put-code'],
            title: summary.title?.title?.value,
            type: summary.type ?? undefined,
            date: isoDate(summary['publication-date']),
            doi,
            url: summary.url?.value ?? resolved,
            journal: summary['journal-title']?.value ?? undefined,
        });

        if (!parsed.success) {
            console.warn('Skipping malformed ORCID work:', parsed.error.flatten());
            return [];
        }
        return [parsed.data];
    });
}

/**
 * Project the ORCID `/record` response into the shape we commit.
 *
 * Exported separately from the fetch so the test can run it against a fixture with
 * no network, the same split as `parseFeed` in youtube.ts.
 */
export function parseRecord(json: Json, fetchedAt = new Date().toISOString().slice(0, 10)): OrcidRecord {
    const person = json.person ?? {};
    const activities = json['activities-summary'] ?? {};

    const given = person.name?.['given-names']?.value ?? '';
    const family = person.name?.['family-name']?.value ?? '';

    return RecordSchema.parse({
        orcid: json['orcid-identifier']?.path ?? ORCID_ID,
        uri: json['orcid-identifier']?.uri ?? ORCID_URI,
        fetchedAt,
        name: [given, family].filter(Boolean).join(' '),
        urls: (person['researcher-urls']?.['researcher-url'] ?? [])
            .filter((entry: Json) => entry?.url?.value)
            .map((entry: Json) => ({ name: entry['url-name'] ?? '', url: entry.url.value })),
        affiliations: [
            ...flattenAffiliations(activities.educations, 'education'),
            ...flattenAffiliations(activities.employments, 'employment'),
        ],
        works: flattenWorks(activities.works),
    });
}

// --- Fetch ---

/**
 * Read the live record. Only the sync script calls this; the site never does.
 * Throws on failure — unlike a build-time fetch, a hand-run sync should stop and
 * say so rather than quietly writing a thinner snapshot over a good one.
 */
export async function fetchRecord(): Promise<OrcidRecord> {
    const response = await fetch(ORCID_API_URL, {
        headers: { Accept: 'application/json', 'User-Agent': 'antonebsen.dk sync' },
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        throw new Error(`ORCID returned ${response.status} ${response.statusText}`);
    }
    return parseRecord(await response.json());
}

// --- The committed snapshot ---

/**
 * The record as committed, parsed rather than cast.
 *
 * Importing src/data/orcid.json directly does not work for the parts that matter.
 * `works` is `[]` today, which TypeScript reads as `never[]`, so every field access
 * in a publications renderer is a type error until the first DOI lands — precisely
 * when nobody wants to be fixing types. `kind` widens to `string` for the same
 * reason. Running it through the schema gives the renderer the shape the record
 * will have, and turns a hand-edit that breaks the file into a loud failure at
 * build time instead of a blank section in production.
 */
export const record: OrcidRecord = RecordSchema.parse(snapshot);

// --- Profile links ---

/**
 * A researcher URL as it should appear in `sameAs`.
 *
 * The ResearchGate link on the record was pasted straight out of a browser and
 * still carries `?ev=hdr_xprf&_tp=<base64 session blob>`. schema.org `sameAs` is a
 * claim that two URLs identify the same entity, so it wants the canonical profile,
 * not one visit to it — and republishing someone's navigation trail on every page
 * of the site is a poor idea regardless.
 */
export function profileUrl(url: string): string {
    return url.split(/[?#]/)[0].replace(/\/$/, '');
}

/**
 * `sameAs` for the site's schema.org Person, derived from the record rather than
 * hand-kept, so adding a profile on ORCID is enough to have it show up here. The
 * ORCID URI leads: it is the identifier the others are being tied to.
 *
 * `extra` carries profiles the record does not know about — X is on the site but
 * not on ORCID — and duplicates are dropped so a URL added to ORCID later does not
 * appear twice.
 */
export function sameAsProfiles(record: OrcidRecord, extra: string[] = []): string[] {
    const fromRecord = record.urls
        .map((entry) => profileUrl(entry.url))
        // The personal website is the subject of the page, not another profile of it.
        .filter((url) => !/^https?:\/\/(www\.)?antonebsen\.dk$/i.test(url));

    return [...new Set([record.uri, ...fromRecord, ...extra.map(profileUrl)])];
}

// --- Reconciling the record with the CV ---

/**
 * The CV names the same university three ways, and none of them is ORCID's own
 * spelling in two of the three. Comparing the strings directly would fail on the
 * first run and teach everyone to ignore the test, so institutions are matched
 * through this list instead.
 */
export const UCPH_ALIASES = [
    'Københavns Universitet',
    'University of Copenhagen',
    'Universität Kopenhagen',
] as const;

/**
 * Every spelling the CV uses for an organisation that appears on the record, keyed
 * by the record's own name for it. One entry today; the shape is here so adding the
 * Djøf teaching role to ORCID is a line in this table rather than a new code path.
 */
const ORG_ALIASES: Record<string, readonly string[]> = {
    'University of Copenhagen': UCPH_ALIASES,
};

const norm = (s: string) => s.trim().toLowerCase();

/** Does this CV institution name refer to the organisation the record calls `recordOrg`? */
function isSameOrg(cvInstitution: string, recordOrg: string): boolean {
    if (norm(cvInstitution) === norm(recordOrg)) return true;
    const aliases = ORG_ALIASES[recordOrg];
    return aliases ? aliases.some((alias) => norm(alias) === norm(cvInstitution)) : false;
}

/**
 * The affiliation on the public record that backs a CV entry's institution, if any.
 *
 * This is what the "verified on ORCID" markers hang off. Returning `undefined` is
 * the interesting half: Djøf and the HHX are genuinely not on the record, and a
 * marker that appeared on every row would say nothing. Exact-or-alias, never a
 * substring test — `includes("Copenhagen")` is what made /de/education fall back to
 * hardcoded English, since "Universität Kopenhagen" contains neither spelling.
 */
export function orcidBacks(institution: string | undefined): OrcidAffiliation | undefined {
    if (!institution) return undefined;
    return record.affiliations.find((a) => isSameOrg(institution, a.organization));
}

/**
 * How each CV says "and still there". ORCID says it by omitting the end date, so
 * this is the other half of that comparison.
 */
export const ONGOING_TOKENS: Record<string, string> = { da: 'nu', en: 'present', de: 'heute' };

export function matchesUcph(institution: string | undefined): boolean {
    if (!institution) return false;
    return UCPH_ALIASES.some((alias) => norm(alias) === norm(institution));
}

/**
 * The name the site publishes for Anton, and the rule tying it to the record's.
 *
 * These do not match today: ORCID holds "Anton Meier Ebsen" with no credit name,
 * while the site, ResearchGate and our own JSON-LD all say "Anton Meier Ebsen
 * Jørgensen". Since `@id` and `sameAs` now assert the two are one person, and a name
 * is what a reconciliation service actually compares, the gap is worth a guard.
 *
 * Containment rather than equality, deliberately: equality is what we want and it
 * would fail on the first run, so this asserts what is true now and still catches a
 * record that acquires the wrong surname. Set the credit name on orcid.org to
 * "Anton Meier Ebsen Jørgensen" and this can tighten to `===`.
 */
export const PUBLISHED_NAME = 'Anton Meier Ebsen Jørgensen';

export function nameAgreesWithRecord(recordName: string, published = PUBLISHED_NAME): boolean {
    // An empty name is contained in every string, so it would pass a bare
    // containment test while telling us nothing — a record that lost its name is
    // exactly the case worth failing on.
    if (!recordName?.trim()) return false;
    return norm(published).includes(norm(recordName));
}

/**
 * First year named in a CV period string such as "2021 – nu". The dash varies
 * between an en dash and a hyphen across the three files, so this reads the first
 * four-digit run rather than splitting on a separator.
 */
export function startYear(period: string | undefined): number | undefined {
    const match = period?.match(/\d{4}/);
    return match ? Number(match[0]) : undefined;
}

export function isOngoing(period: string | undefined, lang: string): boolean {
    const token = ONGOING_TOKENS[lang];
    if (!period || !token) return false;
    return period.toLowerCase().includes(token);
}

/** Earliest start year across the record's affiliations at a given organisation. */
export function earliestStartYear(record: OrcidRecord, matches: (org: string) => boolean): number | undefined {
    const years = record.affiliations
        .filter((a) => matches(a.organization))
        .map((a) => startYear(a.start))
        .filter((y): y is number => typeof y === 'number');

    return years.length ? Math.min(...years) : undefined;
}
