import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Until now this covered the homepage, /ai-project and three video pages. Nothing
// built for the welfare paper had ever been scanned — not a project page, not
// /team, not a blog post, and none of the interactive charts.
const pages = [
    '/',
    '/ai-project',
    // The video section: index, a detail page and a series page.
    '/videoer',
    '/videoer/dolomites-day-1',
    '/videoer/serie/italy-2026',
    // The seminar paper and everything built around it.
    '/projects/welfare-state-seminar',
    '/en/projects/welfare-state-seminar',
    '/team',
    '/blog/welfare-part-1',
    '/models/rolling-window',
    // The ledger. Its rows were previously only ever rendered inside a hidden
    // modal, so the muted-on-muted locked state was never actually scanned.
    '/ledger',
    '/en/ledger',
    // The German /now page, which the nav linked to for six months before it existed.
    '/de/now',
];

// The charts are React islands mounted with client:visible, so they hydrate only
// once scrolled into view. Scanning without this audits the server-rendered
// placeholder and reports a clean run for markup no visitor sees.
async function hydrateIslands(page: import('@playwright/test').Page) {
    await page.evaluate(async () => {
        const step = window.innerHeight;
        // Re-measure every iteration. Each island that mounts makes the document
        // taller, so a height sampled once at the top stops short of the components
        // near the bottom — which are exactly the ones worth auditing.
        for (let y = 0, guard = 0; y < document.body.scrollHeight && guard < 200; y += step, guard++) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
}

async function settleAnimations(page: import('@playwright/test').Page) {
    // Fade-ins start at opacity 0, and axe sampling mid-transition reports contrast
    // for a state the user never actually reads.
    await page.addStyleTag({
        content: `*, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
        }`
    });
    await page.waitForTimeout(300);
}

test.describe('Accessibility Tests', () => {
    for (const pagePath of pages) {
        test(`checks ${pagePath} for a11y violations`, async ({ page }) => {
            await page.goto(pagePath);
            await settleAnimations(page);
            await hydrateIslands(page);

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            expect(accessibilityScanResults.violations).toEqual([]);
        });
    }
});

// Chart.js paints into a bare <canvas>, which a screen reader announces as an
// unnamed image — the entire finding, invisible. axe only catches this once the
// island has hydrated, so assert the labels directly rather than relying on the
// scan above to have scrolled far enough.
test('every chart canvas has a description with real numbers in it', async ({ page }) => {
    await page.goto('/projects/welfare-state-seminar');

    // Bring each chart into view on its own rather than sweeping the whole 20,000px
    // document. The specification curve fetches its 64 estimates on mount, and on the
    // dev server that request queues behind every module the rest of the page is
    // pulling — enough to outlast any sensible timeout.
    // A label naming the chart but stating nothing is not worth having, so each one
    // has to contain a digit.
    const charts: [string, string][] = [
        ['rolling coefficients', '#projectChart'],
        ['specification curve', '#spec-curve canvas'],
    ];

    for (const [name, selector] of charts) {
        const anchor = selector.startsWith('#spec-curve') ? '#spec-curve' : '#projectChart';
        await page.locator(anchor).first().scrollIntoViewIfNeeded().catch(() => {});
        const locator = page.locator(selector);
        await expect(locator, `${name}: canvas never appeared`).toBeAttached({ timeout: 30_000 });
        await expect(locator, `${name}: canvas has no aria-label`)
            .toHaveAttribute('aria-label', /-?\d/, { timeout: 30_000 });
    }
});

// A 64-bar specification curve, a nine-row regime table and two break-test tables
// had never been looked at below 768px. Phone width is where they break if they
// break anywhere.
test.describe('Accessibility at 375px', () => {
    const mobilePages = [
        '/projects/welfare-state-seminar',
        '/team',
        '/blog/welfare-part-1',
        '/models/rolling-window',
        // Four columns of ruled ledger at phone width.
        '/en/ledger',
    ];

    for (const pagePath of mobilePages) {
        test(`checks ${pagePath} at mobile width`, async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto(pagePath);
            await settleAnimations(page);
            await hydrateIslands(page);

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            expect(accessibilityScanResults.violations).toEqual([]);

            // Nothing may push the page sideways. A wide table or chart has to
            // scroll inside its own container, not drag the whole document with it.
            const overflow = await page.evaluate(() =>
                document.documentElement.scrollWidth - document.documentElement.clientWidth
            );
            expect(overflow, 'page scrolls horizontally at 375px').toBeLessThanOrEqual(1);
        });
    }
});
