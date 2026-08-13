import { test, expect } from '@playwright/test';

/**
 * Command palette regressions.
 *
 * This component had no test coverage at all, and it shipped broken twice: once
 * as raw TypeScript (a `lang="ts"` attribute opted the script out of compilation,
 * so Cmd-K never bound), and once with `renderResults` reading a `q` that only
 * existed in `handleSearch`'s scope — every search returning 8 or more results
 * threw a ReferenceError instead of rendering the "see all" link.
 *
 * Both were invisible to `astro check` output that already carried 617 errors.
 */

const open = async (page: import('@playwright/test').Page) => {
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.locator('#command-palette')).toHaveClass(/is-open/);
};

const search = async (page: import('@playwright/test').Page, q: string) => {
    const input = page.locator('#palette-input');
    await input.fill(q);
    // handleSearch runs on `input`; fill() dispatches it.
    await expect(page.locator('#palette-results-list')).not.toHaveClass(/hidden/);
};

test.describe('command palette', () => {
    test('Cmd-K opens it and Escape closes it', async ({ page }) => {
        await page.goto('/');

        const palette = page.locator('#command-palette');
        await open(page);
        await expect(palette).toHaveAttribute('aria-hidden', 'false');

        await page.keyboard.press('Escape');
        await expect(palette).not.toHaveClass(/is-open/);
        await expect(palette).toHaveAttribute('aria-hidden', 'true');
    });

    test('a broad query renders results', async ({ page }) => {
        await page.goto('/');
        await open(page);
        await search(page, 'en');

        const items = page.locator('#palette-results-list .palette-item');
        await expect(items.first()).toBeVisible();
        expect(await items.count()).toBeGreaterThan(0);
    });

    test('8+ results render the see-all link carrying the query', async ({ page }) => {
        await page.goto('/');
        await open(page);
        await search(page, 'en');

        // The regression: this threw ReferenceError: q is not defined, so the link
        // never appeared and the results list was left half-rendered.
        const seeAll = page.locator('#palette-results-list a[href^="/search?q="]');
        await expect(seeAll).toHaveAttribute('href', '/search?q=en');
        await expect(seeAll).toContainText(/\d+/);
    });

    test('the empty state quotes the query back, escaped', async ({ page }) => {
        await page.goto('/');
        await open(page);
        await search(page, '<img src=x onerror=alert(1)>');

        const list = page.locator('#palette-results-list');
        await expect(list).toContainText('Ingen resultater for');
        // The query is interpolated into innerHTML, so it must arrive as text.
        expect(await list.locator('img').count()).toBe(0);
    });

    test('English pages get English palette strings', async ({ page }) => {
        await page.goto('/en');
        await open(page);
        await search(page, 'zzzznothing');

        await expect(page.locator('#palette-results-list')).toContainText('No results for');
        // Previously the script hardcoded Danish here regardless of page language.
        await expect(page.locator('#palette-results-list')).not.toContainText('Ingen resultater');
    });

    test('opening moves focus to the input', async ({ page }) => {
        await page.goto('/');
        await open(page);

        // `visibility` was caught up in `transition-all duration-200`, and discrete
        // properties flip at the halfway mark — so the element was still hidden when
        // the old 10ms timeout called focus(), making it a silent no-op. The palette
        // opened with focus left on <body>.
        await expect(page.locator('#palette-input')).toBeFocused();
    });

    test('focus stays inside the dialog when tabbing', async ({ page }) => {
        await page.goto('/');
        await open(page);
        await expect(page.locator('#palette-input')).toBeFocused();

        // aria-modal="true" promises this; focusableElements was collected for a
        // trap that was never wired, so Tab used to walk out into the page behind.
        for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');

        const inside = await page.evaluate(() =>
            !!document.getElementById('command-palette')?.contains(document.activeElement));
        expect(inside, 'focus is still within the palette after 25 tabs').toBe(true);
    });
});
