import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
    '/',
    '/about',
    '/cases'
];

test.describe('Accessibility Tests', () => {
    for (const pagePath of pages) {
        test(`checks ${pagePath} for a11y violations`, async ({ page }) => {
            await page.goto(pagePath);

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            expect(accessibilityScanResults.violations).toEqual([]);
        });
    }
});
