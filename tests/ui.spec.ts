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

    test('the language switcher keeps you on the same page', async ({ page }) => {
        // The three links were hardcoded '/', '/en' and '/de', so switching
        // language threw away whatever you were reading.
        await page.goto('/en/about');

        await expect(page.locator('.lang-link').nth(0)).toHaveAttribute('href', '/about');
        await expect(page.locator('.lang-link').nth(1)).toHaveAttribute('href', '/en/about');
        await expect(page.locator('.lang-link').nth(2)).toHaveAttribute('href', '/de/about');

        // The current language is marked, which it never was before.
        await expect(page.locator('.lang-link').nth(1)).toHaveAttribute('aria-current', 'true');
    });

    test('the language switcher never offers a link that 404s', async ({ page, request }) => {
        // localizedPath alone is prefix-only, so /videoer would become
        // /en/videoer — a route that does not exist. Anything unresolvable has
        // to fall back to that language's home rather than break.
        for (const path of ['/videoer', '/cliometrics', '/en/about', '/ledger']) {
            await page.goto(path);

            const hrefs = await page.locator('.lang-link').evaluateAll(
                (els) => els.map((el) => el.getAttribute('href')!)
            );
            expect(hrefs, `${path} should offer three languages`).toHaveLength(3);

            for (const href of hrefs) {
                const res = await request.get(href);
                expect(res.status(), `${path}: switcher offered ${href}`).toBe(200);
            }
        }
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
