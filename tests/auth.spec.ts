import { test, expect } from '@playwright/test';

/**
 * The admin auth bypass, as a regression test.
 *
 * The session cookie used to hold the constant string "authorized_session",
 * compared with `!==` in src/middleware.ts. That literal is in a public repo, so the
 * check was forgeable with one header — no browser, no XSS:
 *
 *   curl -X POST /api/skills -H "Cookie: auth_token=authorized_session"
 *
 * and it was the only thing guarding roughly twenty routes that insert into and
 * delete from the live Supabase database.
 *
 * The first test below is the one that must never go green for the wrong reason.
 */

// A route the middleware protects: not in the publicPostRoutes allowlist.
const WRITE_ROUTE = '/api/skills';

test.describe('admin API is not reachable without a valid session', () => {
    test('the old constant token is rejected', async ({ request }) => {
        const res = await request.post(WRITE_ROUTE, {
            headers: { Cookie: 'auth_token=authorized_session', 'Content-Type': 'application/json' },
            data: { name: 'forged', proficiency: 100 }
        });
        expect(res.status(), 'forged constant cookie must not authenticate').toBe(401);
    });

    test('no cookie is rejected', async ({ request }) => {
        const res = await request.post(WRITE_ROUTE, { data: {} });
        expect(res.status()).toBe(401);
    });

    test('an arbitrary cookie value is rejected', async ({ request }) => {
        const res = await request.post(WRITE_ROUTE, {
            headers: { Cookie: 'auth_token=anything-at-all' },
            data: {}
        });
        expect(res.status()).toBe(401);
    });

    test('a structurally valid but unsigned token is rejected', async ({ request }) => {
        // Right shape, wrong signature — the expiry is signed, so a far-future one
        // cannot simply be pasted in.
        const forged = `${Date.now() + 10_000_000}.abcdefghijkl.not-a-real-signature`;
        const res = await request.post(WRITE_ROUTE, {
            headers: { Cookie: `auth_token=${forged}` },
            data: {}
        });
        expect(res.status()).toBe(401);
    });

    test('sensitive GET routes are guarded too', async ({ request }) => {
        const res = await request.get('/api/contact', {
            headers: { Cookie: 'auth_token=authorized_session' }
        });
        expect(res.status()).toBe(401);
    });
});

test.describe('the dashboard gate checks the value, not just presence', () => {
    test('an arbitrary cookie still shows the login gate', async ({ page }) => {
        // The gate used to be `Astro.cookies.has("auth_token")`, so any value opened it.
        await page.context().addCookies([
            { name: 'auth_token', value: 'anything-at-all', url: 'http://localhost:4321' }
        ]);
        await page.goto('/dashboard');
        await expect(page.locator('#login-gate')).toBeVisible();
    });
});

test.describe('login', () => {
    /**
     * Everything above only proves requests get refused — which would also be true
     * if the middleware were blanket-401ing and admin was simply broken. This is the
     * other direction: a correct password must still produce a session that works.
     *
     * Skipped where ADMIN_PASSWORD is not configured (CI, a fresh clone), because
     * there is no way to log in there and a failure would mean nothing.
     */
    test('a correct password issues a session that passes the middleware', async ({ request }) => {
        const password = process.env.ADMIN_PASSWORD;
        test.skip(!password, 'ADMIN_PASSWORD not set in this environment');

        const login = await request.post('/api/auth/login', { data: { password } });
        expect(login.status(), 'login with the real password').toBe(200);

        const cookie = login
            .headersArray()
            .filter((h) => h.name.toLowerCase() === 'set-cookie')
            .map((h) => h.value)
            .join('; ');
        expect(cookie, 'a session cookie was set').toContain('auth_token=');

        const token = cookie.match(/auth_token=([^;]+)/)?.[1] ?? '';
        expect(token).not.toBe('authorized_session');

        const res = await request.post(WRITE_ROUTE, {
            headers: { Cookie: `auth_token=${token}` },
            data: {}
        });
        // 500 is expected without a database; the point is that it is not 401.
        expect(res.status(), 'a real session must clear the middleware').not.toBe(401);

        // And one flipped character must not.
        const tampered = `${token.slice(0, -1)}X`;
        const bad = await request.post(WRITE_ROUTE, {
            headers: { Cookie: `auth_token=${tampered}` },
            data: {}
        });
        expect(bad.status()).toBe(401);
    });

    test('a wrong password is rejected and echoes nothing back', async ({ request }) => {
        const res = await request.post('/api/auth/login', {
            data: { password: 'definitely-not-the-password' }
        });
        // 503 when ADMIN_PASSWORD is unset in this environment — also a refusal.
        expect([401, 429, 503]).toContain(res.status());

        const body = await res.text();
        expect(body, 'the response must not reflect the attempt back').not.toContain(
            'definitely-not-the-password'
        );
    });
});
