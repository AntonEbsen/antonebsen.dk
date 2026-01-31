import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {

    // We mask dynamic elements (like timestamps or random quotes) to prevent false positives
    test('homepage matches snapshot', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveScreenshot('homepage.png', {
            mask: [page.locator('#timeline-container'), page.locator('.animate-pulse')],
            fullPage: true
        });
    });

    test('about page matches snapshot', async ({ page }) => {
        await page.goto('/about');
        await expect(page).toHaveScreenshot('about-page.png', {
            fullPage: true
        });
    });

    // Component-level snapshots
    test('navbar mobile menu matches snapshot', async ({ page }) => {
        // Set viewport to mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Open menu
        await page.click('#mobile-menu-btn');
        // Wait for animation
        await page.waitForTimeout(500);

        // Check only the menu container if possible, or full page
        await expect(page).toHaveScreenshot('mobile-menu-open.png');
    });

});
