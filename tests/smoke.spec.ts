import { test, expect } from '@playwright/test';

const pages = [
    '/',
    '/en',
    '/about',
    '/en/about',
    '/ai-project',
    '/cases',
    '/stats/training',
    '/dashboard', // New page
];

test.describe('Smoke Tests', () => {
    for (const pagePath of pages) {
        test(`loads ${pagePath} successfully`, async ({ page }) => {
            const response = await page.goto(pagePath);
            expect(response?.status()).toBe(200);
            await expect(page).toHaveTitle(/Anton|Ebsen/);
        });
    }
});
