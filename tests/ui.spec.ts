import { test, expect } from '@playwright/test';

test.describe('UI Stability & Navigation', () => {

    test('Language Switching (EN <-> DA)', async ({ page }) => {
        // 1. Start at English Home
        await page.goto('/en');
        await expect(page).toHaveTitle(/Anton Ebsen/);

        // Check English Nav
        const projectsLink = page.getByRole('link', { name: 'Projects', exact: true });
        await expect(projectsLink).toBeVisible();

        // 2. Switch to Danish
        await page.locator('.lang-btn').click();
        await page.locator('.lang-link[href="/"]').click();

        // 3. Verify URL and Danish Content
        await expect(page).toHaveURL(/\/$/); // Should be at root
        const projekterLink = page.getByRole('link', { name: 'Projekter', exact: true });
        await expect(projekterLink).toBeVisible();
    });

    test('CV Page Rendering', async ({ page }) => {
        await page.goto('/cv'); // Danish CV by default

        // Check for specific CV Item (Djøf)
        const experienceItem = page.locator('.cv-item').filter({ hasText: 'Djøf' });
        await expect(experienceItem).toBeVisible();

        // Check for Education (KU)
        const educationItem = page.locator('.cv-item').filter({ hasText: 'Københavns Universitet' });
        await expect(educationItem).toBeVisible();

        // Ensure no broken "undefined" text
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('undefined');
    });

    test('Guestbook Navigation & Form', async ({ page }) => {
        await page.goto('/guestbook');

        // Check title
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Check for form inputs
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

});
