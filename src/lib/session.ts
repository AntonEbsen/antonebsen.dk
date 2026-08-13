import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

/**
 * Signed, expiring admin sessions.
 *
 * The cookie used to hold the constant string "authorized_session", compared with
 * `!==` in the middleware. That literal is in a public repo, so the check was
 * forgeable with a plain header — no browser and no XSS needed:
 *
 *   curl -X POST https://antonebsen.dk/api/skills -H "Cookie: auth_token=authorized_session"
 *
 * and it was the only thing in front of ~20 routes that write to Supabase.
 *
 * A session is now `<expiry>.<nonce>.<hmac>`, signed with SESSION_SECRET. Forging one
 * requires the secret, and the server enforces the expiry rather than trusting the
 * cookie's own maxAge, which a client controls.
 */

/** Default lifetime. Matches the cookie maxAge set in the login route. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Read at call time, not module scope: Astro evaluates `import.meta.env` at build,
 * while the serverless function needs the runtime value, and the tests need to vary
 * it between cases.
 */
function secret(): string | undefined {
    const value =
        (typeof process !== 'undefined' ? process.env?.SESSION_SECRET : undefined) ||
        import.meta.env?.SESSION_SECRET;

    return value && String(value).length > 0 ? String(value) : undefined;
}

const sign = (payload: string, key: string): string =>
    createHmac('sha256', key).update(payload).digest('base64url');

/**
 * Constant-time compare that does not leak length through an early return.
 * `timingSafeEqual` throws on a length mismatch, so compare digests of the inputs —
 * both are then fixed-width.
 */
function safeEqual(a: string, b: string): boolean {
    const ha = createHmac('sha256', 'cmp').update(a).digest();
    const hb = createHmac('sha256', 'cmp').update(b).digest();
    return timingSafeEqual(ha, hb);
}

/**
 * Mints a session valid for `ttlMs`.
 *
 * Returns null when SESSION_SECRET is unset — callers must treat that as a failure
 * to log in rather than falling back to something weaker.
 */
export function createSession(ttlMs: number = SESSION_TTL_MS): string | null {
    const key = secret();
    if (!key) return null;

    const expiry = Date.now() + ttlMs;
    // The nonce makes two sessions minted in the same millisecond distinct, so a
    // token is not simply a function of its expiry.
    const nonce = randomBytes(12).toString('base64url');
    const payload = `${expiry}.${nonce}`;

    return `${payload}.${sign(payload, key)}`;
}

/**
 * True only for a well-formed, correctly signed, unexpired session.
 *
 * Fails closed on every other input, including a missing secret — a deploy without
 * SESSION_SECRET authenticates nobody rather than everybody.
 */
export function verifySession(value: string | undefined | null): boolean {
    const key = secret();
    if (!key || !value) return false;

    const parts = value.split('.');
    if (parts.length !== 3) return false;

    const [expiryRaw, nonce, signature] = parts;
    if (!expiryRaw || !nonce || !signature) return false;

    const expiry = Number(expiryRaw);
    if (!Number.isFinite(expiry)) return false;

    // Check the signature before the clock, so a tampered expiry cannot be probed.
    if (!safeEqual(sign(`${expiryRaw}.${nonce}`, key), signature)) return false;

    return Date.now() < expiry;
}

/** Convenience for the two middleware call sites and the dashboard gate. */
export function isAuthorized(cookieValue: string | undefined | null): boolean {
    return verifySession(cookieValue);
}
