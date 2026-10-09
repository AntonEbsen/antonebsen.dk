import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SECURITY_HEADERS, CSP } from './security-headers';

/**
 * vercel.json and the middleware used to carry two different policies. This keeps
 * them one: the JSON Vercel applies to prerendered pages must say exactly what the
 * middleware says to server-rendered ones.
 */
describe('security headers', () => {
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const rule = vercel.headers.find((h: any) => h.source === '/(.*)');
    const fromVercel: Record<string, string> = Object.fromEntries(
        (rule?.headers ?? []).map((h: { key: string; value: string }) => [h.key, h.value]),
    );

    it('vercel.json carries every header the middleware sets, with the same value', () => {
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            expect(fromVercel[key], key).toBe(value);
        }
    });

    it('vercel.json sets nothing the middleware does not', () => {
        expect(Object.keys(fromVercel).sort()).toEqual(Object.keys(SECURITY_HEADERS).sort());
    });

    it('allows WebAssembly but not eval', () => {
        expect(CSP).toContain("'wasm-unsafe-eval'");
        expect(CSP).not.toContain("'unsafe-eval'");
    });

    it('lets prerendered pages report to Sentry', () => {
        expect(CSP).toMatch(/connect-src[^;]*https:\/\/\*\.sentry\.io/);
    });

    it('no longer names the icon CDN, which is served from here now', () => {
        expect(CSP).not.toContain('fontawesome.com');
        expect(CSP).not.toMatch(/style-src[^;]*cdnjs/);
    });
});
