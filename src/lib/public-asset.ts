import { existsSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(process.cwd(), 'public');

// Whether public/ is reachable at all. At build time it is; inside a Vercel
// serverless function it is not, because static files are served by the CDN and
// never bundled into the lambda. Without this check every asset would look
// missing at runtime and a server-rendered page would hide content that is
// perfectly fine — so when public/ is out of reach we assume the asset exists and
// leave things exactly as they were.
const canCheck = existsSync(publicDir);

/**
 * Does this URL point at a file that actually ships in public/?
 *
 * Pages were written before their figures, decks and PDFs existed, and most of
 * those files still do not. Linking to a 404 is worse than not offering the link,
 * so callers use this to drop missing assets before rendering. Prerendered pages
 * resolve it at build time, which costs a visitor nothing, and the asset comes
 * back on its own the moment the real file lands in public/.
 *
 * Anything not served from public/ — external URLs, in-page anchors, the '#'
 * placeholder — is not ours to verify and is reported as present.
 */
export function assetExists(url?: string): boolean {
    if (!url) return false;
    if (!url.startsWith('/')) return true;
    if (!canCheck) return true;
    const clean = url.split(/[?#]/)[0];
    return existsSync(join(publicDir, decodeURIComponent(clean)));
}
