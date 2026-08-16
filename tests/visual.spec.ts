import { test, expect, type Page } from '@playwright/test';

/**
 * Settle the scroll reveal before capturing.
 *
 * Sections carry `.animate-on-scroll` and are revealed by an IntersectionObserver
 * as they enter the viewport. Under `fullPage`, Playwright scrolls the document
 * to stitch the capture, which reveals fresh sections while it goes — so the two
 * consecutive screenshots it compares for stability never match and the shot
 * times out. Walk the page to the bottom first, wait for every element to be
 * marked, then return to the top and capture a page that has finished moving.
 */
async function settleReveals(page: Page) {
    await page.evaluate(async () => {
        const targets = [...document.querySelectorAll('.animate-on-scroll')];
        if (!targets.length) return;

        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
            window.scrollTo(0, y);
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        }

        targets.forEach((el) => el.classList.add('in-view'));
        window.scrollTo(0, 0);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });

    await settleOrnaments(page);
}

/**
 * Put the drawn ornaments in their finished state.
 *
 * toHaveScreenshot disables animations, which finishes CSS *animations* — but
 * TerrainRule draws via a scripted stroke-dashoffset and a class the observer
 * adds on approach, and ContourField staggers its rings by index. Both settle
 * on their own; forcing them removes the timing race that made the homepage
 * shot flaky rather than failing.
 */
async function settleOrnaments(page: Page) {
    await page.evaluate(() => {
        for (const rule of document.querySelectorAll('.terrain-rule')) {
            rule.classList.add('is-drawn');
            const line = rule.querySelector<SVGPathElement>('.terrain-rule__line');
            if (line) line.style.strokeDashoffset = '0';
        }
        for (const ring of document.querySelectorAll<SVGPathElement>('.contour-field path')) {
            ring.style.animation = 'none';
            ring.style.opacity = '1';
        }
    });
}

/** A valid 1×1 PNG. Stands in for every remote thumbnail, so the pixels are ours. */
const STUB_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
);

test.describe('Visual Regression', () => {

    /**
     * Take the network out of the picture, literally.
     *
     * YouTubeEmbed posters come from i.ytimg.com, and by its own comment
     * maxresdefault 404s on some uploads, so there is an onerror handler that swaps in
     * hqdefault at runtime. Inside a fullPage screenshot that is a race with no winner:
     * whether the capture lands before or after the swap — or before the image arrives
     * at all — decides what gets compared, and the homepage shot failed on exactly that
     * while passing on retry.
     *
     * Serving a fixed image locally makes every run identical without masking anything,
     * so the region stays covered rather than being excluded from comparison. That
     * matters here specifically: the thresholds on these tests were tightened after a
     * whole-site recolour slipped through, and a mask is how coverage quietly goes back.
     */
    test.beforeEach(async ({ page }) => {
        await page.route('**://i.ytimg.com/**', (route) =>
            route.fulfill({ status: 200, contentType: 'image/png', body: STUB_PNG }),
        );
    });

    // We mask dynamic elements (like timestamps or random quotes) to prevent false positives
    test('homepage matches snapshot', async ({ page }) => {
        await page.goto('/');
        await settleReveals(page);
        await expect(page).toHaveScreenshot('homepage.png', {
            mask: [page.locator('#timeline-container'), page.locator('.animate-pulse')],
            fullPage: true,
            // Tightened from 0.03. `threshold` is the per-pixel colour tolerance,
            // and its 0.2 default is what let an entire recolour through unnoticed —
            // the background shift was smaller than the tolerance, and the accent
            // covers under 1% of the page. tests/theme.spec.ts asserts the palette
            // directly; this is here for layout and gross visual change.
            threshold: 0.1,
            maxDiffPixelRatio: 0.01
        });
    });

    test('about page matches snapshot', async ({ page }) => {
        await page.goto('/about');
        await settleReveals(page);
        await expect(page).toHaveScreenshot('about-page.png', {
            fullPage: true,
            // Tightened from 0.03. `threshold` is the per-pixel colour tolerance,
            // and its 0.2 default is what let an entire recolour through unnoticed —
            // the background shift was smaller than the tolerance, and the accent
            // covers under 1% of the page. tests/theme.spec.ts asserts the palette
            // directly; this is here for layout and gross visual change.
            threshold: 0.1,
            maxDiffPixelRatio: 0.01
        });
    });

    // Component-level snapshots
    test('mobile layout matches snapshot', async ({ page }) => {
        // Set viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await settleReveals(page);

        // Remove click on non-existent button
        // Just verify the stacked mobile layout

        await expect(page).toHaveScreenshot('mobile-layout.png', {
            // Tightened from 0.03. `threshold` is the per-pixel colour tolerance,
            // and its 0.2 default is what let an entire recolour through unnoticed —
            // the background shift was smaller than the tolerance, and the accent
            // covers under 1% of the page. tests/theme.spec.ts asserts the palette
            // directly; this is here for layout and gross visual change.
            threshold: 0.1,
            maxDiffPixelRatio: 0.01
        });
    });

});
