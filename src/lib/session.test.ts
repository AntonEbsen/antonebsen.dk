import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSession, verifySession, SESSION_TTL_MS } from './session';

/**
 * The auth these replace: the cookie held the constant "authorized_session",
 * compared with `!==`. The literal is in a public repo, so anyone could forge it
 * with a header and reach ~20 routes that write to Supabase. The case that matters
 * most below is "rejects the old constant token".
 */

const SECRET = 'test-secret-not-a-real-one';

beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
});

afterEach(() => {
    delete process.env.SESSION_SECRET;
    vi.useRealTimers();
});

describe('createSession', () => {
    it('mints a three-part token', () => {
        const token = createSession();
        expect(token).toBeTruthy();
        expect(token!.split('.')).toHaveLength(3);
    });

    it('returns null when the secret is missing, rather than something weaker', () => {
        delete process.env.SESSION_SECRET;
        expect(createSession()).toBeNull();
    });

    it('does not repeat itself, even within the same millisecond', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
        expect(createSession()).not.toBe(createSession());
    });
});

describe('verifySession', () => {
    it('accepts a session it just minted', () => {
        expect(verifySession(createSession())).toBe(true);
    });

    it('rejects the old constant token', () => {
        // The whole point of the change.
        expect(verifySession('authorized_session')).toBe(false);
    });

    it('rejects a tampered signature', () => {
        const token = createSession()!;
        const [expiry, nonce, sig] = token.split('.');
        const flipped = sig[0] === 'a' ? `b${sig.slice(1)}` : `a${sig.slice(1)}`;
        expect(verifySession(`${expiry}.${nonce}.${flipped}`)).toBe(false);
    });

    it('rejects an extended expiry, because the expiry is signed', () => {
        const token = createSession()!;
        const [, nonce, sig] = token.split('.');
        const farFuture = Date.now() + 10 * SESSION_TTL_MS;
        expect(verifySession(`${farFuture}.${nonce}.${sig}`)).toBe(false);
    });

    it('rejects a session signed with a different secret', () => {
        const token = createSession()!;
        process.env.SESSION_SECRET = 'a-different-secret';
        expect(verifySession(token)).toBe(false);
    });

    it('rejects an expired session', () => {
        const token = createSession(1000)!;
        vi.useFakeTimers();
        vi.setSystemTime(Date.now() + 5000);
        expect(verifySession(token)).toBe(false);
    });

    it('rejects everything when the secret is unset — fails closed', () => {
        const token = createSession()!;
        delete process.env.SESSION_SECRET;
        expect(verifySession(token)).toBe(false);
        expect(verifySession('anything')).toBe(false);
    });

    it('rejects malformed input without throwing', () => {
        for (const bad of ['', 'a', 'a.b', 'a.b.c.d', '...', 'notanumber.n.s']) {
            expect(verifySession(bad), bad).toBe(false);
        }
        expect(verifySession(undefined)).toBe(false);
        expect(verifySession(null)).toBe(false);
    });
});
