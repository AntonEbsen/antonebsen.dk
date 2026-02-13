
import type { APIContext, MiddlewareNext } from "astro";

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
        "connect-src 'self' https://ka-f.fontawesome.com https://*.supabase.co https://vitals.vercel-insights.com https://cdn.vercel-insights.com https://*.sentry.io https://*.ingest.de.sentry.io",
        "media-src 'self' https:",
        "worker-src 'self' blob:",
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
    const isPublicGuestbook = (_context.url.pathname === "/api/guestbook" || _context.url.pathname === "/api/guestbook/") && _context.request.method === "POST";
    const isPublicChat = (_context.url.pathname === "/api/chat" || _context.url.pathname === "/api/chat/") && _context.request.method === "POST";
    const isPublicSTT = (_context.url.pathname === "/api/stt" || _context.url.pathname === "/api/stt/") && _context.request.method === "POST";

    if (isApiRequest && protectedMethods.includes(_context.request.method) && !isAuthRoute && !isPublicGuestbook && !isPublicChat && !isPublicSTT) {
        const token = _context.cookies.get("auth_token");
        if (!token || token.value !== "authorized_session") {
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
        const token = _context.cookies.get("auth_token");
        if (!token || token.value !== "authorized_session") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
    }

    return response;
}
