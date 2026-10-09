import type { APIContext, MiddlewareNext } from "astro";
import { verifySession } from "./lib/session";
import { SECURITY_HEADERS } from "./lib/security-headers";

// The policy and the other headers live in src/lib/security-headers.ts, shared with
// vercel.json (which Vercel applies to the prerendered pages this middleware never
// sees). A unit test keeps the two identical.
function withSecurityHeaders(response: Response): Response {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }
    return response;
}

// Security: API routes that mutate need a session, unless listed as public below.
// PATCH was missing from this set, so a handler that happened to export one was open.
const PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Public POST endpoints: forms/widgets a visitor can submit without logging in.
// These have their own hardening (Zod validation, honeypot, rate limiting).
const PUBLIC_POST_ROUTES = new Set([
    "/api/guestbook",
    "/api/chat",
    "/api/contact",
    "/api/subscribe",
    // Called by a widget a logged-out visitor can see, and it was missing here — so
    // the DataPlayground's "generate SQL" returned 401 to everyone except a signed-in
    // Anton. It carries its own rate limit, which the auth gate had stood in for.
    //
    // /api/speak and /api/stt were listed here too, until both were deleted: voice
    // now runs entirely in the browser and needs no endpoint.
    "/api/text-to-sql",
    // Article reactions are a visitor widget too. The route was not listed, and
    // because the gate used to run *after* the handler (see onRequest) the row was
    // inserted anyway while the visitor was shown a 401 — so the omission never
    // surfaced. Now that the gate holds, the route has to be public to keep working.
    "/api/reactions",
    // The /qa page's "ask a question" form. It POSTed here for as long as the form
    // has existed, and the route had no POST handler, so every question was lost.
    "/api/qa",
]);
// The blog view counter: POST /api/views/<slug>, same story as /api/reactions.
const PUBLIC_POST_PREFIXES = ["/api/views/"];

// GET endpoints that return private data.
const SENSITIVE_GET_ROUTES = new Set(["/api/contact", "/api/backup"]);

function unauthorized(): Response {
    return withSecurityHeaders(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        }),
    );
}

export async function onRequest(context: APIContext, next: MiddlewareNext) {
    // The gate runs *before* `next()`. It used to run after it: `await next()` was the
    // first line of this function, so every protected handler — Supabase inserts and
    // deletes included — had already executed by the time the session was checked,
    // and the 401 merely replaced the response on its way out. The caller saw a
    // refusal; the database saw a committed write.
    const method = context.request.method;
    // One normalised path for every check. The write check used to strip a trailing
    // slash and the sensitive-GET check did not, so `/api/backup/` slipped past it.
    const path = context.url.pathname.replace(/\/$/, "") || "/";

    if (path.startsWith("/api/")) {
        const isAuthRoute = path.startsWith("/api/auth/");
        const isPublicPost =
            method === "POST" &&
            (PUBLIC_POST_ROUTES.has(path) || PUBLIC_POST_PREFIXES.some((prefix) => path.startsWith(prefix)));
        const isProtectedWrite = PROTECTED_METHODS.has(method) && !isAuthRoute && !isPublicPost;
        const isSensitiveRead = method === "GET" && SENSITIVE_GET_ROUTES.has(path);

        // Sessions are HMAC-signed and expiring; see src/lib/session.ts. (The cookie
        // was once compared against a constant string that sat in this public repo,
        // which made every write route forgeable with one header.)
        if ((isProtectedWrite || isSensitiveRead) && !verifySession(context.cookies.get("auth_token")?.value)) {
            return unauthorized();
        }
    }

    return withSecurityHeaders(await next());
}
