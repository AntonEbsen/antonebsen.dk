/**
 * The site's security headers, in one place.
 *
 * They were kept twice and disagreed: vercel.json (applied by Vercel to the ~200
 * prerendered pages) allowed 'unsafe-eval' and knew nothing about Sentry, while
 * src/middleware.ts (applied to server-rendered responses) allowed Sentry and nothing
 * about vercel.live. So the same site had two policies depending on whether a page
 * happened to be prerendered, error reports from static pages were blocked, and a
 * change to one file quietly did not reach the other.
 *
 * The middleware imports this; vercel.json carries the same strings, and
 * security-headers.test.ts fails the moment the two drift apart. Edit here, then
 * copy the value into vercel.json (the test tells you which header).
 */
export const CSP = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' rather than 'unsafe-eval': the DataPlayground runs DuckDB
    // compiled to WebAssembly, which Chrome will not instantiate under a policy that
    // allows neither. This is the narrower of the two. Scripts are also allowed
    // from cdnjs for pdf.js, which src/lib/pdfjs-loader.ts fetches on demand.
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com https://cdn.vercel-insights.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    // api.open-meteo.com powers the weather cards on /camino/route.
    "connect-src 'self' https://*.supabase.co https://vercel.live https://*.vercel-scripts.com https://vitals.vercel-insights.com https://cdn.vercel-insights.com https://*.sentry.io https://*.ingest.de.sentry.io https://api.open-meteo.com",
    "media-src 'self' https:",
    "worker-src 'self' blob:",
    // frame-src: third-party embeds. Without this, iframes fall back to default-src
    // 'self' and are blocked outright (this once silently broke /soundtrack).
    "frame-src 'self' https://vercel.live https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
].join('; ');

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
    'Content-Security-Policy': CSP,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
};
