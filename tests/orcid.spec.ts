import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the parts of the site's identity graph that fail invisibly.
 *
 * The file is named for ORCID because that is where the graph started, but its
 * subject is now broader: the ORCID record, the author attribution on project pages,
 * and the research group's Organization node with its ResearchGate lab. They belong
 * together because they fail the same way — none of them is visible on the page.
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

// Duplicated from src/lib/researchgate.ts rather than imported, for the same reason
// the record is read from disk: no test in tests/ reaches into src/. Short enough
// that a mismatch shows up as a failing assertion rather than silent drift.
const PROFILE_URL = 'https://www.researchgate.net/profile/Anton-Meier-Ebsen-Jorgensen';
const LAB_URL =
    'https://www.researchgate.net/lab/Applied-Econometrics-Quantitative-Economics-Group-Anton-Meier-Ebsen-Jorgensen';
const LAB_NAME = 'Applied Econometrics & Quantitative Economics Group';

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

        // Asserts what the name says, rather than banning "?" outright. The old rule
        // was correct by accident: every profile the site had put its identity in the
        // path. Google Scholar puts it in the query string — /citations?user=… — so
        // the blunt version would have rejected a URL that is entirely canonical.
        const TRACKING = ['ev=', '_tp=', 'hl=', 'oi=', 'utm_'];

        for (const url of person.sameAs as string[]) {
            expect(url).toMatch(/^https:\/\//);
            for (const key of TRACKING) {
                expect(url, `${url} carries ${key}`).not.toContain(key);
            }
        }
    });

    test('the Scholar profile keeps the parameter that identifies it', async ({ page }) => {
        // The regression profileUrl() was rewritten to prevent: stripping the query
        // string wholesale published https://scholar.google.com/citations, which is
        // a page belonging to nobody.
        await page.goto('/');

        const graph = (await jsonLd(page)).flatMap((d) => d['@graph'] ?? [d]);
        const person = graph.find((n: any) => n['@type'] === 'Person');

        const scholar = (person.sameAs as string[]).find((u) => u.includes('scholar.google.com'));
        expect(scholar, 'Scholar profile in sameAs').toBeTruthy();
        expect(scholar).toContain('user=');
        expect(scholar, 'the locale and origin params are not identity').not.toMatch(/[?&](hl|oi)=/);
    });

    /**
     * /team describes a real research group — three named members, four joint
     * projects, a timeline from 2020 — and said nothing machine-readable about the
     * group itself until this node existed. Every crawler saw a page about one
     * person, because SEO.astro's default Person node was all that reached it.
     */
    for (const [path, name] of [['/team', 'Forskningsteamet'], ['/en/team', 'Research Group']]) {
        test(`${path} states the group exists, and links the lab`, async ({ page }) => {
            await page.goto(path);

            const org = (await jsonLd(page))
                .flatMap((d) => d['@graph'] ?? [d])
                .find((n: any) => n['@type'] === 'Organization');

            expect(org, 'Organization node').toBeTruthy();
            expect(org.name).toBe(name);

            // The page keeps its own name; the formal one is what a machine matches
            // against ResearchGate, so it has to survive here rather than only in prose.
            expect(org.alternateName).toBe(LAB_NAME);
            expect(org.sameAs, 'the lab this group is also published as').toContain(LAB_URL);
        });
    }

    test('the group names its members, and claims an identifier only for Anton', async ({ page }) => {
        await page.goto('/team');

        const org = (await jsonLd(page))
            .flatMap((d) => d['@graph'] ?? [d])
            .find((n: any) => n['@type'] === 'Organization');

        const members = org.member as { '@id'?: string; name: string }[];
        expect(members.length, 'members listed').toBeGreaterThan(1);
        expect(members[0]['@id'], 'Anton resolves to the ORCID record').toBe(RECORD.uri);

        // Same rule as ScholarlyArticle.author: a collaborator's ORCID is theirs to
        // publish, and asserting the wrong one for them is worse than asserting none.
        for (const other of members.slice(1)) {
            expect(other['@id'], `${other.name} must carry no @id`).toBeUndefined();
        }
    });

    test('the group does not claim to be a university department', async ({ page }) => {
        // It is a group that met at UCPH, which is not the same as being a unit of
        // it. parentOrganization would say the second thing.
        await page.goto('/team');

        const org = (await jsonLd(page))
            .flatMap((d) => d['@graph'] ?? [d])
            .find((n: any) => n['@type'] === 'Organization');

        expect(org.parentOrganization).toBeUndefined();
        expect(org.memberOf).toBeUndefined();
    });
});

test.describe('societies are memberships, not profiles', () => {
    const societyNode = async (page: import('@playwright/test').Page) => {
        const graph = (await jsonLd(page)).flatMap((d) => d['@graph'] ?? [d]);
        return graph.find((n: any) => n['@type'] === 'Person');
    };

    test('the Person node claims the societies it holds', async ({ page }) => {
        // memberOf, not sameAs. sameAs says two URLs are the same entity; a society
        // is not Anton, he is a member of it.
        await page.goto('/');
        const person = await societyNode(page);

        expect(person.memberOf, 'memberOf on the Person node').toBeTruthy();
        expect(person.memberOf.length).toBeGreaterThan(1);
        for (const org of person.memberOf) {
            expect(org['@type']).toBe('Organization');
            expect(org.url).toMatch(/^https:\/\//);
        }
    });

    test('EH.net is on the page but not in the structured data', async ({ page }) => {
        // The assertion this whole `status` field exists for. A reader sees the word
        // "joining" next to it; a crawler reading memberOf sees nothing, because it
        // cannot see the caveat. A membership not yet held is not a membership.
        await page.goto('/');
        const person = await societyNode(page);

        const names = (person.memberOf as { name: string }[]).map((o) => o.name);
        expect(names, 'EH.net must not be claimed until joined').not.toContain('EH.net');

        await page.goto('/organizations');
        await expect(page.getByText('EH.net').first()).toBeVisible();
    });

    test('/organizations links every society that has a URL', async ({ page }) => {
        // `url: "#"` sat on the one existing entry and never rendered, because
        // neither page linked the name at all. Now that they do, "#" must not
        // become a link to nowhere.
        for (const path of ['/organizations', '/en/organizations']) {
            await page.goto(path);

            const links = await page.locator('#orgs a[href^="http"]').evaluateAll((els) =>
                els.map((el) => el.getAttribute('href') ?? ''),
            );

            expect(links.length, `society links on ${path}`).toBeGreaterThan(2);
            for (const href of links) expect(href, `${href} on ${path}`).not.toBe('#');
        }
    });

    test('the mojibake separator is gone', async ({ page }) => {
        // /organizations rendered "Forperson Â· 2024 – nu" — a UTF-8 middot read as
        // Latin-1 — to every visitor.
        for (const path of ['/organizations', '/en/organizations']) {
            await page.goto(path);
            const text = await page.locator('#orgs').innerText();
            expect(text, `mojibake on ${path}`).not.toContain('Â');
        }
    });
});

test.describe('the shared library is synced, not typed', () => {
    test('/team renders the Zotero library with resolvable DOIs', async ({ page }) => {
        for (const path of ['/team', '/en/team']) {
            await page.goto(path);

            const dois = await page.locator('a[href^="https://doi.org/"]').evaluateAll((els) =>
                els.map((el) => el.getAttribute('href') ?? ''),
            );

            expect(dois.length, `DOI links on ${path}`).toBeGreaterThan(0);
            for (const href of dois) expect(href).toMatch(/^https:\/\/doi\.org\/10\./);
        }
    });

    test('the hand-typed citation list is gone rather than duplicated', async ({ page }) => {
        // The eight strings lived twice — a const on the Danish page and inline on
        // the English one — and overlapped the Zotero library. If they came back,
        // /team would show both and the typed copy would be the one that drifts.
        await page.goto('/team');
        const body = await page.locator('main').innerText();

        expect(body).not.toContain('Dilemma not Trilemma');
        expect(body).not.toContain('Cross-Border Banking and Global Liquidity');
    });

    test('the site never calls the Zotero API at runtime', async ({ page }) => {
        // Zotero is read by the sync script only; the page renders a committed
        // snapshot. Same rule as ResearchGate, for a different reason — here the API
        // works, and we still do not want the page depending on it.
        const calls: string[] = [];
        page.on('request', (r) => {
            if (r.url().includes('zotero.org')) calls.push(r.url());
        });

        await page.goto('/team');
        await page.waitForLoadState('networkidle');

        expect(calls, 'requests to zotero.org').toEqual([]);
    });
});

test.describe('Google Scholar can read the papers', () => {
    // Scholar does not read JSON-LD. It reads Highwire citation_* meta tags, and its
    // guidelines say a PDF is "processed as if [it] had no meta tags" unless an HTML
    // page points at it with citation_pdf_url. Scholar had already indexed this paper
    // with no year and no venue for exactly that reason.
    const PAPER = '/projects/welfare-state-seminar';

    const metaTags = (page: import('@playwright/test').Page) =>
        page.$$eval('head meta[name^="citation_"]', (nodes) =>
            nodes.map((n) => ({
                name: n.getAttribute('name') ?? '',
                content: n.getAttribute('content') ?? '',
            })),
        );

    test('the paper with a PDF carries the tags Scholar requires', async ({ page }) => {
        await page.goto(PAPER);
        const tags = await metaTags(page);
        const names = tags.map((t) => t.name);

        for (const required of ['citation_title', 'citation_author', 'citation_publication_date', 'citation_pdf_url']) {
            expect(names, `${required} on ${PAPER}`).toContain(required);
        }

        // One tag per author. Joined into a single tag, Scholar reads the whole list
        // as one person's name.
        expect(names.filter((n) => n === 'citation_author').length).toBeGreaterThan(1);
        expect(tags.find((t) => t.name === 'citation_publication_date')?.content).toMatch(/^\d{4}/);
    });

    test('the PDF it advertises actually resolves', async ({ page, request }) => {
        await page.goto(PAPER);
        const pdf = (await metaTags(page)).find((t) => t.name === 'citation_pdf_url')?.content;

        expect(pdf, 'citation_pdf_url').toBeTruthy();
        expect(pdf).toMatch(/^https:\/\/antonebsen\.dk\//);

        // Fetched against the dev server rather than the absolute host in the tag.
        const res = await request.get(new URL(pdf!).pathname);
        expect(res.status(), `${pdf} should resolve`).toBe(200);
    });

    test('a project with no PDF carries no citation tags at all', async ({ page }) => {
        // The gate is the point. Eleven of the twelve projects declare a pdfUrl for a
        // file that has never been produced; offering Scholar an abstract page plus a
        // dead link is worse than offering it nothing.
        await page.goto('/projects/genai-inequality');
        expect(await metaTags(page)).toEqual([]);
    });

    test('the tags parse into head, not merely appear in the markup', async ({ page }) => {
        // Worth its own test because the failure is invisible in the source. The
        // Vercel adapter injects <vercel-speed-insights> and <vercel-analytics> into
        // head; both are unknown elements, and the HTML parser closes head on the
        // first one it meets. The tags were emitted after them, so the raw HTML read
        // correctly and the DOM put all nine in <body> — where Scholar never looks.
        await page.goto(PAPER);

        const placement = await page.evaluate(() => ({
            inHead: document.querySelectorAll('head meta[name^="citation_"]').length,
            total: document.querySelectorAll('meta[name^="citation_"]').length,
        }));

        expect(placement.total, 'citation tags on the page').toBeGreaterThan(0);
        expect(placement.inHead, 'every citation tag must parse inside head').toBe(placement.total);
    });

    test('a seminar paper is never dressed as a journal article', async ({ page }) => {
        await page.goto(PAPER);
        const names = (await metaTags(page)).map((t) => t.name);

        expect(names).not.toContain('citation_journal_title');
        expect(names).not.toContain('citation_conference_title');
        expect(names).not.toContain('citation_issn');
    });
});

test.describe('ResearchGate is linked, never fetched', () => {
    test('the profile is reachable from the pages that carry profile links', async ({ page }) => {
        for (const path of ['/', '/cv', '/contact']) {
            await page.goto(path);
            const links = page.locator(`a[href="${PROFILE_URL}"]`);
            expect(await links.count(), `ResearchGate link on ${path}`).toBeGreaterThan(0);
        }
    });

    test('no ResearchGate URL carries the tracking blob the record still holds', async ({ page }) => {
        // The URL on the ORCID record ends in ?ev=hdr_xprf and a base64 session
        // string. src/lib/orcid.ts strips it before sameAs; this checks nothing has
        // pasted the raw form back in anywhere a reader can click.
        for (const path of ['/', '/cv', '/contact', '/team', '/en/team']) {
            await page.goto(path);
            const hrefs = await page.locator('a[href*="researchgate.net"]').evaluateAll((els) =>
                els.map((el) => el.getAttribute('href') ?? ''),
            );
            expect(hrefs.length, `ResearchGate links on ${path}`).toBeGreaterThan(0);
            for (const href of hrefs) {
                expect(href, `${href} on ${path}`).not.toContain('?');
            }
        }
    });

    test('the site never calls ResearchGate at runtime', async ({ page }) => {
        // There is no API and every automated request gets a 403, so a request to
        // researchgate.net from a page would be a mistake that fails silently in
        // production. Anything RG is a link, never a fetch.
        const calls: string[] = [];
        page.on('request', (r) => {
            if (r.url().includes('researchgate.net')) calls.push(r.url());
        });

        await page.goto('/team');
        await page.waitForLoadState('networkidle');

        expect(calls, 'requests to researchgate.net').toEqual([]);
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
