import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
    '/',
    '/ai-project',
    // The video section: index, a detail page and a series page.
    '/videoer',
    '/videoer/dolomites-day-1',
    '/videoer/serie/italy-2026',
];

test.describe('Accessibility Tests', () => {
    for (const pagePath of pages) {
        test(`checks ${pagePath} for a11y violations`, async ({ page }) => {
            await page.goto(pagePath);

            // Settle animations before measuring. Fade-ins start at opacity 0, and
            // axe sampling mid-transition reports contrast for a state the user
            // never actually reads.
            await page.addStyleTag({
                content: `*, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                }`
            });
            await page.waitForTimeout(300);

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            expect(accessibilityScanResults.violations).toEqual([]);
        });
    }
});
