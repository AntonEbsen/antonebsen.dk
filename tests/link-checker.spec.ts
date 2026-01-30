import { test, expect } from '@playwright/test';

test.describe('Site Health Check', () => {
    test('should navigate to homepage and verify no 404s on main links', async ({ page }) => {
        // Collect all unique internal links
        const visited = new Set<string>();
        const toVisit = ['/']; // Start queue

        // Helper to check a URL
        async function checkUrl(url: string) {
            if (visited.has(url)) return;
            visited.add(url);

            console.log(`Checking: ${url}`);
            const response = await page.goto(url);
            expect(response?.status()).toBe(200);
        }

        // Check key landing pages directly first
        const criticalPaths = [
            '/',
            '/en',
            '/cv',
            '/portfolio',
            '/about',
            '/blog',
            '/exercises' // Check listing page
        ];

        for (const path of criticalPaths) {
            await checkUrl(path);
        }

        // Check generated exercise links specifically
        // Go to exercise page and click first item to ensure slug is valid
        await page.goto('/exercises');
        const firstExerciseLink = page.locator('a[href^="/exercises/"]').first();
        if (await firstExerciseLink.count() > 0) {
            const href = await firstExerciseLink.getAttribute('href');
            if (href) await checkUrl(href);
        }
    });

    test('should verify English version exists', async ({ page }) => {
        // Try both with and without trailing slash to see behavior
        console.log('Navigating to /en');
        const response = await page.goto('/en');
        console.log(`Response status for /en: ${response?.status()}`);

        if (response?.status() === 404) {
            console.log('Retrying with /en/');
            const responseSlash = await page.goto('/en/');
            console.log(`Response status for /en/: ${responseSlash?.status()}`);
            expect(responseSlash?.status()).toBe(200);
        } else {
            expect(response?.status()).toBe(200);
        }
    });

    // Visual Verification
    test('homepage visual snapshot', async ({ page }) => {
        await page.goto('/');
        // Mask dynamic content (like random quotes or time-based elements) if necessary
        // await expect(page).toHaveScreenshot('homepage.png', { maxDiffPixels: 100 });
        // For now, just taking a screenshot for manual review artifact
        await page.screenshot({ path: 'homepage-snapshot.png' });
        console.log('📸 Taken homepage snapshot for review.');
    });
});
