import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

    // We mask dynamic elements (like timestamps or random quotes) to prevent false positives
    test('homepage matches snapshot', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveScreenshot('homepage.png', {
            mask: [page.locator('#timeline-container'), page.locator('.animate-pulse')],
            fullPage: true,
            maxDiffPixelRatio: 0.03
        });
    });

    test('about page matches snapshot', async ({ page }) => {
        await page.goto('/about');
        await expect(page).toHaveScreenshot('about-page.png', {
            fullPage: true,
            maxDiffPixelRatio: 0.03
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
            maxDiffPixelRatio: 0.03
        });
    });

});
