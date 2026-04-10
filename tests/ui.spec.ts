import { test, expect } from '@playwright/test';

test.describe('UI Stability & Navigation', () => {

    test('Language Switching (EN <-> DA)', async ({ page }) => {
        // 1. Start at English Home
        await page.goto('/en');
        await expect(page).toHaveTitle(/Anton.*Ebsen/);

        // Check English Nav
        const portfolioLink = page.locator('.navbar a').filter({ hasText: /Portfolio/i }).first();
        await portfolioLink.hover();
        const projectsLink = page.locator('.navbar a').filter({ hasText: /Projects/i }).first();
        await expect(projectsLink).toBeVisible();

        // 2. Switch to Danish
        await page.locator('.lang-btn').click();
        await page.locator('.lang-link[href="/"]').click();

        // 3. Verify URL and Danish Content
        await expect(page).toHaveURL(/\/$/); 
        const portefoljeLink = page.locator('.navbar a').filter({ hasText: /Portefølje/i }).first();
        await portefoljeLink.hover();
        const projekterLink = page.locator('.navbar a').filter({ hasText: /Projekter/i }).first();
        await expect(projekterLink).toBeVisible();
    });

    test('CV Page Rendering', async ({ page }) => {
        await page.goto('/cv'); 
        await page.waitForLoadState('networkidle');

        // Check for specific CV Item (Djøf)
        await expect(page.getByText('Djøf').first()).toBeVisible();

        // Check for Education (KU)
        await expect(page.getByText('Københavns Universitet').first()).toBeVisible();
    });

    test('Guestbook Navigation & Form', async ({ page }) => {
        await page.goto('/guestbook');
        await page.waitForLoadState('networkidle');

        // Check title
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Check for form inputs - using IDs as per GuestbookPage.astro
        await expect(page.locator('#g-name')).toBeVisible();
        await expect(page.locator('#g-message')).toBeVisible();
    });

});
