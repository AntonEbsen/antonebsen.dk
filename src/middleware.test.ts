import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequest } from './middleware';
import { createSession } from './lib/session';

/**
 * The order of the auth gate, as a regression test.
 *
 * `onRequest` used to begin with `const response = await next()`, and check the
 * session afterwards. tests/auth.spec.ts asserted that a forged request got a 401 —
 * and it did — but by then the handler had already run, Supabase insert included.
 * A status-code assertion cannot see that. These tests ask the one question that
 * matters: was `next` called?
 */

const SECRET = 'test-secret-not-a-real-one';

beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
});

afterEach(() => {
    delete process.env.SESSION_SECRET;
});

type Context = Parameters<typeof onRequest>[0];
type Next = Parameters<typeof onRequest>[1];

function call(method: string, path: string, cookie?: string) {
    const url = new URL(`http://localhost:4321${path}`);
    const next = vi.fn(async () => new Response('handled', { status: 200 }));
    const context = {
        url,
        request: new Request(url, { method }),
        cookies: {
            get: (name: string) => (name === 'auth_token' && cookie !== undefined ? { value: cookie } : undefined),
        },
    } as unknown as Context;

    return {
        next,
        response: onRequest(context, next as unknown as Next),
    };
}

describe('the auth gate runs before the handler', () => {
    it('refuses an unauthenticated POST to a protected route without calling next', async () => {
        const { next, response } = call('POST', '/api/skills');
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('refuses the old constant cookie without calling next', async () => {
        // The literal that once sat in the middleware, and in this public repo.
        const { next, response } = call('POST', '/api/skills', 'authorized_session');
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it.each(['PUT', 'PATCH', 'DELETE'])('covers %s too', async (method) => {
        // PATCH was missing from the protected set.
        const { next, response } = call(method, '/api/skills');
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('is not fooled by a trailing slash', async () => {
        const { next, response } = call('DELETE', '/api/skills/');
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('lets a signed session through to the handler', async () => {
        const token = createSession();
        expect(token).toBeTruthy();
        const { next, response } = call('POST', '/api/skills', token!);
        expect((await response).status).toBe(200);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe('sensitive GET routes', () => {
    it.each(['/api/backup', '/api/backup/', '/api/contact'])('guards %s before the handler', async (path) => {
        // The write check normalised a trailing slash and this one did not, so
        // `/api/backup/` dumped the tables to anyone.
        const { next, response } = call('GET', path);
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('serves an ordinary API read without a session', async () => {
        const { next, response } = call('GET', '/api/skills');
        expect((await response).status).toBe(200);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe('public visitor routes', () => {
    it.each([
        '/api/chat',
        '/api/guestbook',
        '/api/contact',
        '/api/subscribe',
        '/api/text-to-sql',
        '/api/reactions',
        '/api/qa',
        '/api/views/some-post-slug',
        '/api/auth/login',
    ])('lets an anonymous POST to %s reach the handler', async (path) => {
        const { next, response } = call('POST', path);
        expect((await response).status).toBe(200);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not extend the public list to other methods', async () => {
        const { next, response } = call('DELETE', '/api/reactions');
        expect((await response).status).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('security headers', () => {
    it('are set on a page response', async () => {
        const { response } = call('GET', '/');
        const res = await response;
        expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
        expect(res.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('are set on the 401 as well', async () => {
        const { response } = call('POST', '/api/skills');
        const res = await response;
        expect(res.headers.get('Content-Security-Policy')).toBeTruthy();
        expect(res.headers.get('Content-Type')).toBe('application/json');
    });
});
