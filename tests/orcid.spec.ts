import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the two halves of the ORCID integration that fail invisibly.
 *
 * Nothing else in tests/ asserts any JSON-LD, and the identity `@id` on a project
 * page is not visible on the page at all — a refactor could drop it and nobody would
 * notice for years, at which point every project would be claiming an author no
 * crawler can resolve.
 *
 * The provenance markers fail the other way. Their entire value is that they
 * *distinguish*: two of the four rows on /education are on the public record and two
 * are not. A change that made the marker unconditional would leave every row looking
 * verified, which is worse than having no marker at all — the site would be asserting
 * third-party backing it does not have.
 *
 * The record is read from disk rather than imported: no test in tests/ imports from
 * src/, and content-integrity.spec.ts already reads the blog collection this way.
 */

const RECORD = JSON.parse(
    readFileSync(join(process.cwd(), 'src', 'data', 'orcid.json'), 'utf-8'),
) as {
    uri: string;
    affiliations: { organization: string }[];
    works: unknown[];
};

const ORGS = [...new Set(RECORD.affiliations.map((a) => a.organization))];

/** Every ld+json block on the page, parsed. */
async function jsonLd(page: import('@playwright/test').Page): Promise<any[]> {
    return page.$$eval('script[type="application/ld+json"]', (nodes) =>
        nodes.map((n) => JSON.parse(n.textContent || '{}')),
    );
}

test.describe('the record this suite reads', () => {
    test('has affiliations to distinguish by', () => {
        // Everything below compares the page against this file. If it were empty the
        // assertions would still pass while checking nothing.
        expect(ORGS.length, 'distinct organisations on the record').toBeGreaterThan(0);
        expect(RECORD.uri).toMatch(/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/);
    });
});

test.describe('provenance markers distinguish', () => {
    for (const path of ['/education', '/en/education', '/de/education']) {
        test(`${path} marks some rows and not others`, async ({ page }) => {
            await page.goto(path);

            const degrees = await page.locator('.timeline-item.degree').count();
            const marked = await page.locator('.timeline-item .orcid-verified').count();

            // Deliberately a range rather than "exactly 2". Hardcoding the count would
            // fail the day a role is added to the record — a test breaking because the
            // data got better. These two bounds catch the regressions that matter:
            // the marker disappearing, and the marker rendering on everything.
            expect(degrees, 'degree rows on the timeline').toBeGreaterThan(1);
            expect(marked, 'rows marked as verified').toBeGreaterThan(0);
            expect(marked, 'rows marked as verified').toBeLessThan(degrees);
        });
    }

    test('the gymnasium is never marked, in any language', async ({ page }) => {
        // A permanent truth rather than a snapshot of today: a Danish HHX will not
        // appear on an ORCID record, so if this row ever shows the marker the logic
        // has stopped consulting the record.
        for (const path of ['/education', '/en/education', '/de/education']) {
            await page.goto(path);

            const gymnasium = page
                .locator('.timeline-item.degree')
                .filter({ hasText: /Handelsgymnasiet|Celf/ });

            expect(await gymnasium.count(), `gymnasium row on ${path}`).toBe(1);
            expect(await gymnasium.locator('.orcid-verified').count(), `marker on ${path}`).toBe(0);
        }
    });

    test('every marked row on /en/education names an organisation the record holds', async ({ page }) => {
        // Run on English only, and on purpose. The English CV spells the university
        // exactly as ORCID does, so "marked if and only if backed" can be checked
        // against src/data/orcid.json directly. The Danish and German pages say
        // "Københavns Universitet" and "Universität Kopenhagen", and teaching this
        // test the alias table would just duplicate src/lib/orcid.ts.
        await page.goto('/en/education');

        const rows = await page.locator('.timeline-item.degree').evaluateAll((els) =>
            els.map((el) => ({
                institution: el.querySelector('p.text-sm')?.textContent?.trim() ?? '',
                marked: !!el.querySelector('.orcid-verified'),
            })),
        );

        expect(rows.length).toBeGreaterThan(1);
        for (const row of rows) {
            expect(row.marked, `"${row.institution}" marked`).toBe(ORGS.includes(row.institution));
        }
    });

    test('/experience marks only organisations the record holds', async ({ page }) => {
        // Today the record's one employment is the master's position, which this site
        // files under education — so this page shows no markers at all. The assertion
        // is written so that stays true if that changes: it checks correspondence, not
        // absence, and starts passing meaningfully the day a role is added to ORCID.
        await page.goto('/experience');

        const cards = await page.locator('.roles-grid > *').evaluateAll((els) =>
            els.map((el) => ({
                heading: el.querySelector('h3')?.textContent?.trim() ?? '',
                marked: !!el.querySelector('.orcid-verified'),
            })),
        );

        expect(cards.length, 'role cards').toBeGreaterThan(0);
        for (const card of cards.filter((c) => c.marked)) {
            expect(
                ORGS.some((org) => card.heading.includes(org)),
                `"${card.heading}" is marked but names no organisation on the record`,
            ).toBe(true);
        }
    });
});

test.describe('the identity graph survives', () => {
    test('a project page attributes its author to the ORCID record', async ({ page }) => {
        await page.goto('/projects/welfare-state-seminar');

        const article = (await jsonLd(page)).find((d) => d['@type'] === 'ScholarlyArticle');
        expect(article, 'ScholarlyArticle JSON-LD on the project page').toBeTruthy();

        const authors = article.author as { '@id'?: string; name: string }[];
        expect(authors.length, 'this project has collaborators, which is why it is the case used')
            .toBeGreaterThan(1);

        expect(authors[0]['@id'], 'lead author resolves to the ORCID record').toBe(RECORD.uri);

        // The more interesting half. A collaborator's ORCID is theirs to publish, and
        // asserting the wrong one on their behalf is worse than asserting none.
        for (const other of authors.slice(1)) {
            expect(other['@id'], `${other.name} must carry no @id`).toBeUndefined();
        }
    });

    test('the homepage Person node carries the iD, in both the forms consumers read', async ({ page }) => {
        await page.goto('/');

        const graph = (await jsonLd(page)).flatMap((d) => d['@graph'] ?? [d]);
        const person = graph.find((n: any) => n['@type'] === 'Person');
        expect(person, 'Person node in the @graph').toBeTruthy();

        // @id is what ORCID itself publishes; identifier is what most consumers
        // actually read. The record is stated twice on purpose, so this checks both.
        expect(person['@id']).toBe(RECORD.uri);
        expect(person.identifier).toMatchObject({ propertyID: 'ORCID', value: RECORD.uri });
        expect(person.sameAs, 'sameAs links the profiles to the iD').toContain(RECORD.uri);

        // The ROR id is what actually disambiguates the university; the bare name is
        // a string several institutions could match.
        expect(person.alumniOf?.identifier?.propertyID).toBe('ROR');

        // ORCID holds the personal site as a researcher URL. Listing it back as
        // "the same as" this site would be circular.
        expect(person.sameAs).not.toContain('https://antonebsen.dk');
    });

    test('sameAs carries no tracking parameters', async ({ page }) => {
        // The ResearchGate URL on the record still has a base64 session blob on it.
        // sameAs is a claim that two URLs identify one entity — it wants the profile,
        // not one visit to it.
        await page.goto('/');

        const graph = (await jsonLd(page)).flatMap((d) => d['@graph'] ?? [d]);
        const person = graph.find((n: any) => n['@type'] === 'Person');

        for (const url of person.sameAs as string[]) {
            expect(url, `${url} should be a bare profile URL`).not.toContain('?');
            expect(url).toMatch(/^https:\/\//);
        }
    });
});

test.describe('the printed CV', () => {
    test('shows the iD once, not twice', async ({ page }) => {
        // print.css appends every external href in parentheses, which is right for a
        // link whose text is prose and wrong for one whose text is already the URI.
        // Before this was suppressed the CV printed the iD twice on one line, and the
        // "Download CV" button is window.print(), so print is the export path.
        await page.goto('/cv');
        await page.emulateMedia({ media: 'print' });

        const row = page.locator('.orcid-full');
        await expect(row).toHaveCount(1);

        const rendered = await row.evaluate((el) => ({
            text: (el as HTMLElement).innerText,
            after: getComputedStyle(el, '::after').content,
        }));

        const uri = RECORD.uri;
        expect(rendered.text.split(uri).length - 1, 'occurrences in the link text').toBe(1);
        expect(rendered.after, 'no appended href').not.toContain('orcid.org');
    });

    test('still prints the sidebar the iD lives in', async ({ page }) => {
        // print.css:69 hides `.sidebar`, but the element is `.cv-side` — the rule has
        // matched nothing since someone renamed it, and that is the only reason the
        // iD reaches paper at all. Asserted so the dead rule is not "fixed" without
        // someone first deciding what the printed CV should contain.
        await page.goto('/cv');
        await page.emulateMedia({ media: 'print' });

        await expect(page.locator('.cv-side')).toBeVisible();
        await expect(page.locator('.cv-side .orcid-full')).toBeVisible();
    });
});
