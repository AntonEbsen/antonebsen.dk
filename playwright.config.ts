import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

// Vite loads .env for the dev server, but the Playwright process does not see it —
// which left the one test that proves a *correct* password still works permanently
// skipped, and a skipped test proves nothing. Parse it here; values already present
// in the environment win, so CI is unaffected.
if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
        if (!m) continue;
        const [, key, raw] = m;
        if (process.env[key] === undefined) {
            process.env[key] = raw.trim().replace(/^["']|["']$/g, '');
        }
    }
}

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // One local retry, and a cap on workers. Unbounded parallelism on Windows
    // exhausts file handles — the dev server starts throwing
    // "EMFILE: too many open files" and unrelated tests fail at random. With zero
    // local retries that made the pre-push hook a coin flip, which is exactly what
    // trains people to reach for --no-verify. A genuinely broken test still fails
    // both attempts; CI keeps its stricter 2 retries on a single worker.
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 3,
    reporter: 'list',
    // The baselines in tests/visual.spec.ts-snapshots are *-chromium-win32.png,
    // taken on the machine that runs the pre-push hook. A Linux runner has no
    // baseline of its own, and Playwright fails a screenshot assertion that has
    // nothing to compare against — so, with the rest of CI finally running, the
    // visual suite would be the thing keeping it red. CI skips the screenshot
    // comparisons; everything else in those specs still runs, and the hook on the
    // machine that owns the baselines still compares them.
    ignoreSnapshots: !!process.env.CI,
    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            // The wide sweep visits every route on the site and takes minutes.
            // It lives in its own project so `npm test` — and therefore the
            // pre-push hook — stays the length it is today.
            testIgnore: '**/a11y-wide.spec.ts',
        },
        {
            // npm run test:a11y
            name: 'a11y-wide',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/a11y-wide.spec.ts',
            // One long test; a retry would just double an already slow run.
            retries: 0,
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
