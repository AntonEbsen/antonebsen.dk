/**
 * Copies Font Awesome Free's stylesheet and WOFF2 fonts into public/vendor so the
 * site serves them itself.
 *
 * They came from cdnjs on every page: a third-party host in the critical path of
 * every icon, a preconnect to a domain the privacy page never mentioned, and a
 * version pinned in a <link> rather than in package.json. The package is a
 * devDependency; this runs before `astro dev` and `astro build` (see package.json),
 * and the output directory is gitignored.
 *
 * Only .woff2 is copied. The stylesheet also names .ttf fallbacks, which every
 * browser this site supports skips in favour of WOFF2.
 */
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pkgRoot = dirname(require.resolve('@fortawesome/fontawesome-free/package.json'));
const out = join(process.cwd(), 'public', 'vendor', 'fontawesome');

mkdirSync(join(out, 'css'), { recursive: true });
mkdirSync(join(out, 'webfonts'), { recursive: true });

copyFileSync(join(pkgRoot, 'css', 'all.min.css'), join(out, 'css', 'all.min.css'));

const fonts = readdirSync(join(pkgRoot, 'webfonts')).filter((f) => f.endsWith('.woff2'));
for (const font of fonts) {
    copyFileSync(join(pkgRoot, 'webfonts', font), join(out, 'webfonts', font));
}

if (!existsSync(join(out, 'css', 'all.min.css'))) {
    console.error('vendor-fontawesome: copy failed');
    process.exit(1);
}
console.log(`vendor-fontawesome: css + ${fonts.length} woff2 → public/vendor/fontawesome`);
