import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A shallow accessibility sweep over every static route.
 *
 * `accessibility.spec.ts` scans 13 routes from a hardcoded list, chosen by hand.
 * That list caught nothing on `/now` for months — adding a single page to it
 * this session immediately surfaced a real AA failure (the Pill component's
 * accent variant at 4.26:1) that had been live the whole time. Component-level
 * bugs travel to every page that uses the component, so the useful question is
 * "does anything on the site fail?", not "does anything on these thirteen?".
 *
 * Deliberately shallow: no scroll-driven island hydration, no 375px pass. That
 * keeps it to one request per route while still catching the whole static class
 * — contrast, control names, heading order, landmarks, duplicate ids. The deep
 * scan keeps its 13 routes, its hydration pass and its 375px assertion.
 *
 * It does wait for the network to go idle before sampling. Without that, whether
 * a Chart.js `<canvas role="img">` had painted before axe looked varied between
 * runs, so the same route drifted in and out of the baseline — and a ratchet
 * that flaps is worse than no ratchet. (Turning JavaScript off entirely would
 * also be deterministic, but axe-core injects and runs *in the page*, so it
 * needs JS to work at all.)
 *
 * Not part of `npm test` — run it with `npm run test:a11y`. It takes about five
 * minutes, because the suite runs against `astro dev` and each route pays a Vite
 * compile on first hit. (`astro preview` is not an option: the project is
 * `output: 'server'` on the Vercel adapter, which does not support it.)
 *
 * **Ratcheted, like the type errors.** The first run found violations on dozens
 * of routes, all of them pre-existing. A test that fails on day one guards
 * nothing, and clearing that backlog is its own project — so known violations
 * are baselined in `tests/a11y-baseline.json` and only *new* ones fail. Same
 * bargain as `scripts/check-ratchet.mjs` and `type-errors.json`: the floor only
 * moves down. Regenerate with `npm run test:a11y:update` after fixing some.
 *
 * The baseline keys on `route — ruleId`, deliberately not on the CSS selector:
 * selectors churn with every markup edit, while "this page violates this rule"
 * is the claim actually worth tracking.
 */

const PAGES_DIR = join(process.cwd(), 'src', 'pages');
const BASELINE = join(process.cwd(), 'tests', 'a11y-baseline.json');

/** Prefixes that are not visitor-facing HTML documents. */
const SKIP_PREFIXES = ['api/', 'partials/', 'admin', 'dashboard', 'debug'];

/** Routes whose non-200 status is the correct answer. */
const EXPECTED_STATUS: Record<string, number> = { '/404': 404 };

function routes(): string[] {
    const found: string[] = [];

    for (const rel of readdirSync(PAGES_DIR, { recursive: true, encoding: 'utf-8' })) {
        const file = rel.split('\\').join('/');
        if (!file.endsWith('.astro')) continue;

        // Dynamic segments need real params; the deep scan covers representatives.
        if (file.includes('[')) continue;
        if (SKIP_PREFIXES.some((p) => file.startsWith(p))) continue;
        if (/(^|\/)test-[^/]*\.astro$/.test(file)) continue;

        let route = '/' + file.replace(/\.astro$/, '');
        if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);

        found.push(route || '/');
    }

    return [...new Set(found)].sort();
}

test.describe('Accessibility across every static route', () => {
    // One test rather than ~200: per-test fixtures and the default 30s timeout
    // both bite badly at this scale, and a single failure listing every bad
    // route is more useful than 200 separate reds.
    test('no route has a WCAG A/AA violation', async ({ page }) => {
        const all = routes();
        test.setTimeout(30 * 60 * 1000);

        expect(all.length, 'route enumeration should find the whole site').toBeGreaterThan(100);

        const failures: string[] = [];
        const unreachable: string[] = [];
        // Selectors aren't part of the baseline key, but they are what makes a
        // new failure actionable — so keep them for the report.
        const detail = new Map<string, string>();

        for (const route of all) {
            let response;
            try {
                response = await page.goto(route, { waitUntil: 'domcontentloaded' });
            } catch (err) {
                unreachable.push(`${route} -> ${(err as Error).message.split('\n')[0]}`);
                continue;
            }

            const expected = EXPECTED_STATUS[route] ?? 200;
            if (response && response.status() !== expected) {
                unreachable.push(`${route} -> ${response.status()}`);
                continue;
            }

            // Let above-the-fold islands finish before sampling, so a chart that
            // paints late doesn't toggle a route in and out of the baseline.
            // Best-effort: a page holding a socket open would otherwise stall the
            // whole sweep.
            await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

            // Fade-ins start at opacity 0, and axe sampling mid-transition reports
            // contrast for a state no one ever reads.
            await page.addStyleTag({
                content: `*, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                }`
            });

            const { violations } = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                // Chart.js canvases get their aria-label from client code, so
                // whether this rule fires depends on how far hydration had got
                // when axe looked — the one genuinely unstable result in a scan
                // that never scrolls. It is covered properly elsewhere:
                // accessibility.spec.ts scrolls each chart into view and asserts
                // the label contains real numbers.
                .disableRules(['role-img-alt'])
                .analyze();

            for (const v of violations) {
                failures.push(`${route} — ${v.id}`);
                const where = v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ');
                detail.set(`${route} — ${v.id}`, `${v.impact}: ${where}`);
            }
        }

        // Reported separately: a route that will not load is a different problem
        // from one that loads inaccessibly, and shouldn't hide behind it.
        expect(unreachable, 'routes that did not return 200').toEqual([]);

        const found = [...new Set(failures)].sort();

        if (process.env.A11Y_UPDATE) {
            writeFileSync(BASELINE, JSON.stringify(found, null, 2) + '\n', 'utf-8');
            console.log(`a11y baseline written: ${found.length} known violations across ${all.length} routes.`);
            return;
        }

        const baseline: string[] = existsSync(BASELINE)
            ? JSON.parse(readFileSync(BASELINE, 'utf-8'))
            : [];
        const known = new Set(baseline);

        const added = found.filter((f) => !known.has(f)).map((f) => `${f} (${detail.get(f)})`);
        const fixed = baseline.filter((b) => !found.includes(b));

        if (fixed.length) {
            console.log(
                `${fixed.length} baselined violation(s) no longer occur. ` +
                `Lower the floor with: npm run test:a11y:update\n  ` + fixed.join('\n  ')
            );
        }

        expect(added, 'new accessibility violations').toEqual([]);
    });
});
