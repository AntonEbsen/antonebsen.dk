
import type { APIContext, MiddlewareNext } from "astro";
import { verifySession } from "./lib/session";

export async function onRequest(_context: APIContext, next: MiddlewareNext) {
    const response = await next();
    const headers = response.headers;

    // Content Security Policy (CSP)
    // - script-src: 'unsafe-inline' allowed for Astro hydration/ViewTransitions. Restricted to trusted domains.
    // - connect-src: expanded for Supabase and FontAwesome.
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://va.vercel-scripts.com https://cdn.vercel-insights.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com https://cdnjs.cloudflare.com",
        "img-src 'self' data: https: blob:",
        // api.open-meteo.com powers the weather cards on /camino/route.
        "connect-src 'self' https://ka-f.fontawesome.com https://*.supabase.co https://vitals.vercel-insights.com https://cdn.vercel-insights.com https://*.sentry.io https://*.ingest.de.sentry.io https://api.open-meteo.com",
        "media-src 'self' https:",
        "worker-src 'self' blob:",
        // frame-src: third-party embeds. Without this, iframes fall back to default-src 'self'
        // and are blocked outright (this silently broke the Spotify embeds on /soundtrack).
        "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'"
    ].join("; ");

    headers.set("Content-Security-Policy", csp);
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");

    // ... (CSP headers above) ...

    // Security: Protect API Routes from unauthorized mutations (POST, PUT, DELETE)
    const protectedMethods = ["POST", "PUT", "DELETE"];
    const isApiRequest = _context.url.pathname.startsWith("/api/");
    const isAuthRoute = _context.url.pathname.startsWith("/api/auth/");

    // Public POST endpoints: forms/widgets a visitor can submit without logging in.
    // These have their own hardening (Zod validation, honeypot, rate limiting).
    const publicPostRoutes = new Set([
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
    ]);
    const normalizedPath = _context.url.pathname.replace(/\/$/, "") || "/";
    const isPublicPost = _context.request.method === "POST" && publicPostRoutes.has(normalizedPath);

    // This compared the cookie against the constant "authorized_session" — a literal
    // sitting in a public repo, so the check was forgeable with a plain header and
    // every write route below it was effectively open. Sessions are now HMAC-signed
    // and expiring; see src/lib/session.ts.
    if (isApiRequest && protectedMethods.includes(_context.request.method) && !isAuthRoute && !isPublicPost) {
        if (!verifySession(_context.cookies.get("auth_token")?.value)) {
            // Block request
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    // Protect sensitive GET endpoints
    const sensitiveGetRoutes = ["/api/contact", "/api/backup"];
    if (sensitiveGetRoutes.includes(_context.url.pathname) && _context.request.method === "GET") {
        if (!verifySession(_context.cookies.get("auth_token")?.value)) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
    }

    return response;
}
