import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_U_UnR5iT.mjs';
import { manifest } from './manifest_hpRa4UNX.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/chat.astro.mjs');
const _page4 = () => import('./pages/blog.astro.mjs');
const _page5 = () => import('./pages/books.astro.mjs');
const _page6 = () => import('./pages/cases.astro.mjs');
const _page7 = () => import('./pages/certifications.astro.mjs');
const _page8 = () => import('./pages/contact.astro.mjs');
const _page9 = () => import('./pages/courses.astro.mjs');
const _page10 = () => import('./pages/cv.astro.mjs');
const _page11 = () => import('./pages/education.astro.mjs');
const _page12 = () => import('./pages/en.astro.mjs');
const _page13 = () => import('./pages/experience.astro.mjs');
const _page14 = () => import('./pages/faq.astro.mjs');
const _page15 = () => import('./pages/gallery.astro.mjs');
const _page16 = () => import('./pages/hjemmeside-historie.astro.mjs');
const _page17 = () => import('./pages/kursusstatistik.astro.mjs');
const _page18 = () => import('./pages/map.astro.mjs');
const _page19 = () => import('./pages/media.astro.mjs');
const _page20 = () => import('./pages/notes.astro.mjs');
const _page21 = () => import('./pages/organizations.astro.mjs');
const _page22 = () => import('./pages/podcasts.astro.mjs');
const _page23 = () => import('./pages/portfolio.astro.mjs');
const _page24 = () => import('./pages/quotes.astro.mjs');
const _page25 = () => import('./pages/referencer.astro.mjs');
const _page26 = () => import('./pages/resources.astro.mjs');
const _page27 = () => import('./pages/rss.xml.astro.mjs');
const _page28 = () => import('./pages/search-index.json.astro.mjs');
const _page29 = () => import('./pages/services.astro.mjs');
const _page30 = () => import('./pages/skills.astro.mjs');
const _page31 = () => import('./pages/timeline.astro.mjs');
const _page32 = () => import('./pages/traeningsstatistik.astro.mjs');
const _page33 = () => import('./pages/video-cv.astro.mjs');
const _page34 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/chat.ts", _page3],
    ["src/pages/blog.astro", _page4],
    ["src/pages/books.astro", _page5],
    ["src/pages/cases.astro", _page6],
    ["src/pages/certifications.astro", _page7],
    ["src/pages/contact.astro", _page8],
    ["src/pages/courses.astro", _page9],
    ["src/pages/cv.astro", _page10],
    ["src/pages/education.astro", _page11],
    ["src/pages/en/index.astro", _page12],
    ["src/pages/experience.astro", _page13],
    ["src/pages/faq.astro", _page14],
    ["src/pages/gallery.astro", _page15],
    ["src/pages/hjemmeside-historie.astro", _page16],
    ["src/pages/kursusstatistik.astro", _page17],
    ["src/pages/map.astro", _page18],
    ["src/pages/media.astro", _page19],
    ["src/pages/notes.astro", _page20],
    ["src/pages/organizations.astro", _page21],
    ["src/pages/podcasts.astro", _page22],
    ["src/pages/portfolio.astro", _page23],
    ["src/pages/quotes.astro", _page24],
    ["src/pages/referencer.astro", _page25],
    ["src/pages/resources.astro", _page26],
    ["src/pages/rss.xml.js", _page27],
    ["src/pages/search-index.json.ts", _page28],
    ["src/pages/services.astro", _page29],
    ["src/pages/skills.astro", _page30],
    ["src/pages/timeline.astro", _page31],
    ["src/pages/traeningsstatistik.astro", _page32],
    ["src/pages/video-cv.astro", _page33],
    ["src/pages/index.astro", _page34]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "02c96e4e-f985-41b5-a5c3-d8bcf636d4de",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
