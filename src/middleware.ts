
import type { APIContext, MiddlewareNext } from "astro";

export async function onRequest(context: APIContext, next: MiddlewareNext) {
    const response = await next();
    const headers = response.headers;

    // Content Security Policy (CSP)
    // - script-src: 'unsafe-inline' allowed for Astro hydration/ViewTransitions. Restricted to trusted domains.
    // - connect-src: expanded for Supabase and FontAwesome.
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://va.vercel-scripts.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://ka-f.fontawesome.com https://*.supabase.co https://vitals.vercel-insights.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'"
    ].join("; ");

    headers.set("Content-Security-Policy", csp);
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    return response;
}
