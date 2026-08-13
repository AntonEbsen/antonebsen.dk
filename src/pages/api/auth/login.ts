import type { APIRoute } from "astro";

export const prerender = false;

import { createHmac, timingSafeEqual } from "node:crypto";
import { checkRateLimit } from "../../../lib/ratelimit";
import { createSession, SESSION_TTL_MS } from "../../../lib/session";

/** Constant-time compare over fixed-width digests, so length is not leaked either. */
function passwordMatches(given: string, expected: string): boolean {
    const a = createHmac("sha256", "cmp").update(given).digest();
    const b = createHmac("sha256", "cmp").update(expected).digest();
    return timingSafeEqual(a, b);
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
    try {
        const ip = clientAddress || "127.0.0.1";
        const limit = await checkRateLimit("login", ip);
        if (!limit.success) {
            return new Response(JSON.stringify({ error: "Too many attempts. Blocked for 15 mins." }), { status: 429 });
        }

        const body = await request.json();
        const password = String(body.password || "").trim();

        // No fallback. This used to be `ADMIN_PASSWORD || "quantum"`, with the
        // variable absent from validate-env.mjs — so a deploy that simply forgot to
        // set it accepted a password published in the repo. Fail closed instead.
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD;
        if (!ADMIN_PASSWORD) {
            console.error("[auth] ADMIN_PASSWORD is not set — refusing all logins.");
            return new Response(JSON.stringify({ error: "Server not configured" }), { status: 503 });
        }

        // The line that used to sit here logged the submitted password *and* the real
        // one in plaintext, on every attempt, into retained server logs. Never log
        // either; the outcome below is all that is worth recording.
        if (!passwordMatches(password, ADMIN_PASSWORD)) {
            return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
        }

        const session = createSession(SESSION_TTL_MS);
        if (!session) {
            console.error("[auth] SESSION_SECRET is not set — cannot issue a session.");
            return new Response(JSON.stringify({ error: "Server not configured" }), { status: 503 });
        }

        cookies.set("auth_token", session, {
            path: "/",
            httpOnly: true, // Not accessible via JS
            secure: import.meta.env.PROD, // Only secure in production (HTTPS)
            sameSite: "strict",
            maxAge: SESSION_TTL_MS / 1000
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
}
