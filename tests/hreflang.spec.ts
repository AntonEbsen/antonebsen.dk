import { test, expect } from '@playwright/test';

/**
 * Guards hreflang on the video section.
 *
 * SEO.astro derives alternates by stripping the /en or /de prefix and assuming the
 * rest of the path is identical in every language. That is false for videos, whose
 * slugs are translated: /videoer and /serie in Danish against /videos and /series
 * elsewhere. Every video URL used to advertise alternates that 404. The templates
 * now pass explicit `alternates`, and this test keeps them honest.
 */

const VIDEO_PAGES = [
    '/videoer',
    '/en/videos',
    '/de/videos',
    '/videoer/dolomites-day-1',
    '/en/videos/dolomites-day-1',
    '/de/videos/dolomites-day-1',
    '/videoer/serie/italy-2026',
    '/en/videos/series/italy-2026',
    '/de/videos/series/italy-2026'
];

/** Pulls hreflang targets out of a page, as site-relative paths. */
async function hreflangsOf(page: import('@playwright/test').Page, path: string) {
    await page.goto(path);
    return page.$$eval('link[rel="alternate"][hreflang]', (links) =>
        links
            .map((l) => ({
                lang: l.getAttribute('hreflang')!,
                href: l.getAttribute('href')!,
                type: l.getAttribute('type')
            }))
            // Skip the RSS <link rel="alternate">s, which also carry hreflang.
            .filter((l) => !l.type)
            .map((l) => ({ lang: l.lang, path: l.href.replace('https://antonebsen.dk', '') || '/' }))
    );
}

for (const path of VIDEO_PAGES) {
    test(`hreflang targets resolve: ${path}`, async ({ page, request }) => {
        const alternates = await hreflangsOf(page, path);

        // da, en, de, x-default
        expect(alternates.length, 'four alternates').toBe(4);

        for (const { lang, path: target } of alternates) {
            const res = await request.get(target);
            expect(res.status(), `${path} [${lang}] -> ${target}`).toBe(200);
        }
    });
}

test('video alternates use the translated slugs, not the prefix rule', async ({ page }) => {
    const en = await hreflangsOf(page, '/en/videos/dolomites-day-1');
    const byLang = Object.fromEntries(en.map((a) => [a.lang, a.path]));

    expect(byLang.da).toBe('/videoer/dolomites-day-1');
    expect(byLang.en).toBe('/en/videos/dolomites-day-1');
    expect(byLang.de).toBe('/de/videos/dolomites-day-1');

    const series = await hreflangsOf(page, '/videoer/serie/italy-2026');
    const seriesByLang = Object.fromEntries(series.map((a) => [a.lang, a.path]));

    // "serie" in Danish, "series" elsewhere — the segment itself differs.
    expect(seriesByLang.da).toBe('/videoer/serie/italy-2026');
    expect(seriesByLang.en).toBe('/en/videos/series/italy-2026');
});

test('non-video pages keep the prefix-derived alternates', async ({ page }) => {
    const about = await hreflangsOf(page, '/about');
    const byLang = Object.fromEntries(about.map((a) => [a.lang, a.path]));

    expect(byLang.da).toBe('/about');
    expect(byLang.en).toBe('/en/about');
    expect(byLang.de).toBe('/de/about');
});
