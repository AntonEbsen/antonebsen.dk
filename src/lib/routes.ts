/**
 * Which routes actually exist, so hreflang only claims languages that are really
 * there.
 *
 * SEO.astro used to advertise a Danish, English *and* German alternate for every
 * page by swapping the locale prefix. Only a fraction of the site is translated
 * into German, so most of those URLs 404 — 143 of them at last count. Google
 * treats unresolvable alternates as a broken cluster, which defeats the point of
 * having translations at all.
 *
 * The page files are the source of truth. import.meta.glob is resolved statically
 * by Vite, so the key list is available without loading any module, and adding
 * src/pages/de/foo.astro makes the German alternate appear on its own.
 */

const pageFiles = import.meta.glob('/src/pages/**/*.astro');

export type Lang = 'da' | 'en' | 'de';
export const LANGS: Lang[] = ['da', 'en', 'de'];

/** Turns a page file path into the route it serves, or null if it is not a route. */
export function fileToRoute(file: string): string | null {
    let route = file.replace(/^\/src\/pages/, '').replace(/\.astro$/, '');

    // Rest params would need prefix matching; the project has none today.
    if (route.includes('[...')) return null;

    if (route === '/index') return '/';
    if (route.endsWith('/index')) route = route.slice(0, -'/index'.length);

    return route || '/';
}

const staticRoutes = new Set<string>();
const dynamicRoutes: RegExp[] = [];

for (const file of Object.keys(pageFiles)) {
    const route = fileToRoute(file);
    if (!route) continue;

    if (route.includes('[')) {
        // /blog/[slug] -> ^/blog/[^/]+$
        const pattern = route
            .split('/')
            .map((seg) => (seg.startsWith('[') && seg.endsWith(']') ? '[^/]+' : escapeRegex(seg)))
            .join('/');
        dynamicRoutes.push(new RegExp(`^${pattern}$`));
    } else {
        staticRoutes.add(route);
    }
}

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when a page file serves this path. Trailing slashes are ignored. */
export function routeExists(path: string): boolean {
    const clean = path.replace(/\/+$/, '') || '/';
    if (staticRoutes.has(clean)) return true;
    return dynamicRoutes.some((re) => re.test(clean));
}

/** Strips a leading /en or /de, giving the Danish (root) form of a path. */
export const stripLocale = (path: string) =>
    path.replace(/^\/(en|de)(?=\/|$)/, '') || '/';

/** The path this page would have in `lang`, assuming a prefix-only convention. */
export function localizedPath(path: string, lang: Lang): string {
    const base = stripLocale(path.replace(/\/+$/, '') || '/');
    if (lang === 'da') return base;
    return '/' + lang + (base === '/' ? '' : base);
}

/**
 * hreflang alternates for a page, limited to languages that actually exist.
 * Returns an empty array when the page has no translations — a lone
 * self-referential hreflang tells search engines nothing.
 */
export function availableAlternates(path: string): Partial<Record<Lang, string>> {
    const found: Partial<Record<Lang, string>> = {};

    for (const lang of LANGS) {
        const candidate = localizedPath(path, lang);
        if (routeExists(candidate)) found[lang] = candidate;
    }

    return Object.keys(found).length > 1 ? found : {};
}

/**
 * Where the language switcher should send someone standing on `path`.
 *
 * Not just `localizedPath`: that assumes a prefix-only convention, and a handful
 * of sections have translated slugs (/videoer ↔ /en/videos, /traeningsprogram,
 * /stoicisme). Sending a visitor to /en/videoer would swap a working link for a
 * 404, so anything that doesn't resolve falls back to that language's home.
 *
 * Consequence worth knowing: on those sections this disagrees with the hreflang
 * tags, which do know the translated slug because the page passes `alternates`
 * explicitly. Fixing that properly means moving the alias table in
 * src/lib/video-feed.ts into this file so both read from one source.
 */
export function switchTo(path: string, lang: Lang): string {
    const target = localizedPath(path, lang);
    if (routeExists(target)) return target;
    return lang === 'da' ? '/' : `/${lang}`;
}

/** Exposed for tests and diagnostics. */
export const _routes = { staticRoutes, dynamicRoutes };
