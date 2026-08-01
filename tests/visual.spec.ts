import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

    // We mask dynamic elements (like timestamps or random quotes) to prevent false positives
    test('homepage matches snapshot', async ({ page }) => {
        await page.goto('/');
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
