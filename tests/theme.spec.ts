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

test.describe('opacity modifiers', () => {
    test('token colours accept an alpha channel', async ({ page }) => {
        await page.goto('/');

        /**
         * Tailwind cannot apply an opacity modifier to a colour handed to it as the
         * bare string `var(--accent)`: there are no channels to inject the alpha
         * into, so `bg-accent/20` emitted no declaration at all. Roughly 414 classes
         * in the markup carry a modifier — bg-accent/10, border-accent/30 and
         * friends — and not one of them rendered. The config now supplies
         * `rgb(var(--accent-rgb) / <alpha-value>)`, which is what makes it work.
         *
         * Asserted by generating the classes here rather than by finding them in the
         * page, so this holds regardless of which components happen to be mounted.
         */
        const computed = await page.evaluate(() => {
            const probe = document.createElement('div');
            probe.className = 'bg-accent/20 border-accent/30 text-accent/60';
            document.body.appendChild(probe);
            const cs = getComputedStyle(probe);
            const out = {
                bg: cs.backgroundColor,
                border: cs.borderTopColor,
                color: cs.color
            };
            probe.remove();
            return out;
        });

        // A working alpha modifier yields rgba() with the terracotta channels.
        expect(computed.bg, 'bg-accent/20').toBe('rgba(212, 121, 79, 0.2)');
        expect(computed.border, 'border-accent/30').toBe('rgba(212, 121, 79, 0.3)');
        expect(computed.color, 'text-accent/60').toBe('rgba(212, 121, 79, 0.6)');
    });

    test('the channel tokens agree with the hex tokens', async ({ page }) => {
        await page.goto('/');

        // Two spellings of the same colour sit next to each other in BaseLayout, and
        // nothing but this test stops them drifting apart.
        const pairs = await page.evaluate(() => {
            const cs = getComputedStyle(document.documentElement);
            const read = (n: string) => cs.getPropertyValue(n).trim();
            return [
                ['--bg', read('--bg'), read('--bg-rgb')],
                ['--card', read('--card'), read('--card-rgb')],
                ['--text', read('--text'), read('--text-rgb')],
                ['--text-dim', read('--text-dim'), read('--text-dim-rgb')],
                ['--text-muted', read('--text-muted'), read('--text-muted-rgb')],
                ['--accent', read('--accent'), read('--accent-rgb')],
                ['--accent-light', read('--accent-light'), read('--accent-light-rgb')],
                ['--accent-2', read('--accent-2'), read('--accent-2-rgb')]
            ];
        });

        for (const [name, hex, channels] of pairs) {
            const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            expect(m, `${name} is a plain hex value`).toBeTruthy();
            const fromHex = m!.slice(1).map((h) => parseInt(h, 16)).join(' ');
            expect(channels, `${name}-rgb matches ${hex}`).toBe(fromHex);
        }
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
