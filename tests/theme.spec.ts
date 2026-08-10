import { test, expect } from '@playwright/test';

/**
 * The palette as a contract.
 *
 * The visual regression snapshots passed unchanged through a complete recolour —
 * black-and-gold to stone-and-terracotta — because the accent covers under 1% of
 * the page and the background shift was smaller than Playwright's per-pixel
 * threshold. Pixel diffing is the wrong instrument for colour; reading the tokens
 * catches a change exactly.
 */

const EXPECTED = {
    '--bg': '#17191A',
    '--card': '#1E2122',
    '--text': '#E8E4DC',
    '--text-dim': '#B8BCB5',
    '--text-muted': '#8E938B',
    '--accent': '#D4794F',
    '--accent-2': '#6F9E7B'
};

const readToken = (name: string) =>
    `getComputedStyle(document.documentElement).getPropertyValue('${name}').trim()`;

test.describe('design tokens', () => {
    test('the palette matches the agreed values', async ({ page }) => {
        await page.goto('/');

        for (const [token, expected] of Object.entries(EXPECTED)) {
            const actual = await page.evaluate((t) =>
                getComputedStyle(document.documentElement).getPropertyValue(t).trim(), token);

            expect(actual.toUpperCase(), `${token}`).toBe(expected.toUpperCase());
        }
    });

    test('no gold survives anywhere in the tokens', async ({ page }) => {
        await page.goto('/');

        const all = await page.evaluate(() => {
            const cs = getComputedStyle(document.documentElement);
            return ['--bg', '--card', '--text', '--text-dim', '--text-muted',
                '--accent', '--accent-light', '--accent-2', '--nav', '--glass']
                .map((t) => cs.getPropertyValue(t).trim().toUpperCase())
                .join(' ');
        });

        // The old palette, in every form it appeared in.
        expect(all).not.toContain('D4AF37');
        expect(all).not.toContain('F4C430');
        expect(all).not.toContain('212, 175, 55');
    });

    test('the liturgical theme engine is gone', async ({ page }) => {
        await page.goto('/');

        // Seven accents rotating through the year meant no stable identity.
        const themed = await page.evaluate(() =>
            /theme-(lent|easter|ascension|pentecost|corpus|advent|camino)/.test(
                document.documentElement.className + ' ' + document.body.className
            )
        );
        expect(themed, 'no theme-* class applied').toBe(false);
    });
});

test.describe('typography', () => {
    test('font-serif resolves to Fraunces, not the OS fallback', async ({ page }) => {
        await page.goto('/videoer');
        await page.evaluate(() => document.fonts.ready);

        const el = page.locator('.font-serif').first();
        await expect(el).toBeAttached();

        const family = await el.evaluate((n) => getComputedStyle(n).fontFamily);
        expect(family).toContain('Fraunces');

        // 80 font-serif usages previously fell through to this and nobody noticed.
        const loaded = await page.evaluate(() =>
            [...document.fonts].some((f) => /fraunces/i.test(f.family) && f.status === 'loaded'));
        expect(loaded, 'a Fraunces face actually downloaded').toBe(true);
    });
});

test.describe('track colour coding', () => {
    test('hiking is moss and economics is terracotta', async ({ page }) => {
        await page.goto('/videoer');

        const colors = await page.evaluate(() => {
            const cs = getComputedStyle(document.documentElement);
            const btn = (k: string) =>
                (document.querySelector(`.filter-btn[data-category="${k}"]`) as HTMLElement | null)
                    ?.style.getPropertyValue('--filter-color').trim();
            return {
                moss: cs.getPropertyValue('--accent-2').trim(),
                hiking: btn('hiking'),
                economics: btn('economics')
            };
        });

        expect(colors.hiking).toBe('var(--accent-2)');
        expect(colors.economics).toBe('var(--accent)');
        expect(colors.moss).toBeTruthy();
    });
});
