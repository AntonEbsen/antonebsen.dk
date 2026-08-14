import { test, expect } from '@playwright/test';

// This file used to visit seven paths and assert nothing but the page's own status
// code. It never opened a project page and never touched an asset, which is how 22
// broken figures, slide decks and PDFs — including the download button on the
// bachelor thesis and a "Download PDF" in the footer of every page — survived in
// plain sight. Both gaps are closed below: the page list covers the routes that
// carry real work, and every page has its images and downloads fetched.

const PAGES = [
    // Landing and listing pages
    '/',
    '/en',
    '/cv',
    '/en/cv',
    '/portfolio',
    '/about',
    '/blog',
    '/exercises',
    '/ledger',
    '/en/ledger',
    '/de/ledger',
    '/de/now',

    // Research work — the pages a PhD admissions reader would open
    '/projects/welfare-state-seminar',
    '/en/projects/welfare-state-seminar',
    '/projects/global-financial-cycle',
    '/projects/ecb-taylor-rules',
    '/projects/exchange-rate-dynamics',
    '/research',
    '/en/research',
    '/team',
    '/en/team',
    '/archive',
    '/en/archive',
    '/models/rolling-window',
    '/models/taylor-rule',

    // Pages whose assets were the worst offenders
    '/resources',
    '/gallery',
    '/courses',
    '/influences',
    '/video-cv',
    '/website-history',

    // The blog series behind the seminar paper
    '/blog/welfare-part-1',
    '/blog/welfare-part-2',
    '/blog/welfare-part-3',
    '/en/blog/welfare-part-1'
];

test.describe('Site health', () => {
    for (const path of PAGES) {
        test(`${path} loads and every asset it references resolves`, async ({ page, request }) => {
            const response = await page.goto(path);
            expect(response?.status(), `${path} should return 200`).toBe(200);

            // Everything the browser will actually request: images, media sources,
            // stylesheets, and any download link into /assets. CSS background images
            // are deliberately out of scope — they degrade to no background rather
            // than a broken box, and the dev server inlines every page's CSS into
            // every other page, so scanning them yields noise, not signal.
            const refs = await page.evaluate(() => {
                const urls = new Set<string>();
                for (const el of document.querySelectorAll<HTMLImageElement>('img[src]')) {
                    urls.add(el.getAttribute('src')!);
                }
                for (const el of document.querySelectorAll('source[src], video[src], audio[src], embed[src]')) {
                    urls.add(el.getAttribute('src')!);
                }
                for (const el of document.querySelectorAll('link[rel="stylesheet"][href]')) {
                    urls.add(el.getAttribute('href')!);
                }
                for (const el of document.querySelectorAll('a[href^="/assets"]')) {
                    urls.add(el.getAttribute('href')!);
                }
                // /_image is Astro's own optimizer endpoint, fed by imports from
                // src/assets. A missing source there is a build error, not a 404, so
                // there is nothing here to catch — and in dev the endpoint resets the
                // connection under parallel load, which makes the suite flaky.
                return [...urls].filter(u => u.startsWith('/') && !u.startsWith('/_image'));
            });

            const broken: string[] = [];
            for (const ref of refs) {
                const res = await request.get(ref);
                if (res.status() !== 200) broken.push(`${ref} -> ${res.status()}`);
            }

            expect(broken, `${path} references files that do not resolve`).toEqual([]);
        });
    }

    /**
     * The nav and footer, which the asset test above cannot see: it collects
     * only img/source/link and a[href^="/assets"], so an ordinary <a> was
     * structurally invisible to it. That is why /de/now sat broken for six
     * months and /de/cliometrics for four — neither was ever requested by any
     * test, and the PAGES list above contains no German routes at all.
     *
     * Seeded from one page per language rather than all 31: the nav and footer
     * are identical everywhere, so crawling more pages just repeats the same
     * link set. Seeding from /de is the part that matters — a crawl from / alone
     * would have missed both of the bugs this is here to prevent.
     */
    const NAV_SEEDS = ['/', '/en', '/de'];

    test('every link in the nav and footer resolves', async ({ page, request }) => {
        const found = new Map<string, string>(); // href -> the page it was found on

        for (const seed of NAV_SEEDS) {
            const response = await page.goto(seed);
            expect(response?.status(), `${seed} should return 200`).toBe(200);

            const hrefs = await page.evaluate(() => {
                const urls = new Set<string>();

                for (const el of document.querySelectorAll<HTMLAnchorElement>('nav a[href], footer a[href]')) {
                    const raw = el.getAttribute('href');
                    if (!raw) continue;

                    // Resolving against the document handles protocol-relative and
                    // absolute-same-origin hrefs that a startsWith('/') check would
                    // misclassify. External hosts are skipped: GitHub and LinkedIn
                    // answer CI runners with 999/403 and would only add flake.
                    let url: URL;
                    try {
                        url = new URL(raw, location.href);
                    } catch {
                        continue;
                    }

                    if (url.origin !== location.origin) continue;
                    if (!['http:', 'https:'].includes(url.protocol)) continue; // mailto:, tel:, javascript:
                    if (!url.pathname || url.pathname === '/') continue;

                    urls.add(url.pathname.replace(/\/+$/, '') || '/');
                }

                return [...urls];
            });

            for (const href of hrefs) {
                if (!found.has(href)) found.set(href, seed);
            }
        }

        // The mobile nav re-emits every child link, so this is well above the
        // number of distinct destinations — a low count means the selector broke.
        expect(found.size, 'should have found the nav and footer links').toBeGreaterThan(20);

        // Chunked rather than one request at a time: CI runs with workers: 1, and
        // ~60 serial round-trips against the dev server is needlessly slow.
        const entries = [...found.entries()];
        const broken: string[] = [];

        for (let i = 0; i < entries.length; i += 8) {
            const chunk = entries.slice(i, i + 8);
            const results = await Promise.all(
                chunk.map(async ([href, foundOn]) => ({
                    href,
                    foundOn,
                    status: (await request.get(href)).status()
                }))
            );

            for (const r of results) {
                if (r.status !== 200) broken.push(`${r.href} -> ${r.status} (linked from ${r.foundOn})`);
            }
        }

        expect(broken, 'nav or footer links that do not resolve').toEqual([]);
    });

    test('exercise detail routes resolve from the listing', async ({ page }) => {
        await page.goto('/exercises');
        const first = page.locator('a[href^="/exercises/"]').first();
        if (await first.count() === 0) return;
        const href = await first.getAttribute('href');
        expect(href).toBeTruthy();
        const response = await page.goto(href!);
        expect(response?.status()).toBe(200);
    });

    test('the welfare paper is reachable from the portfolio without knowing its URL', async ({ page }) => {
        // The project detail pages are only worth anything if a visitor can find
        // them. This walks the path a reader takes rather than assuming the slug.
        await page.goto('/portfolio');
        const link = page.locator('a[href="/projects/welfare-state-seminar"]').first();
        await expect(link).toHaveCount(1);
        const response = await page.goto('/projects/welfare-state-seminar');
        expect(response?.status()).toBe(200);
        // textContent rather than a visibility-aware matcher: the hero h1 starts at
        // opacity 0 behind a view-animate observer, so waiting for it to be "visible"
        // just times out.
        const heading = await page.locator('h1').first().textContent();
        expect(heading).toContain('Globalization and the Welfare State');
    });
});
