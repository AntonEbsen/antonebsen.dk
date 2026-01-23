import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_BSM9hWmt.mjs';
import { manifest } from './manifest_C3DBu1ry.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/api/chat.astro.mjs');
const _page4 = () => import('./pages/blog.astro.mjs');
const _page5 = () => import('./pages/books.astro.mjs');
const _page6 = () => import('./pages/cases.astro.mjs');
const _page7 = () => import('./pages/certifications.astro.mjs');
const _page8 = () => import('./pages/chat.astro.mjs');
const _page9 = () => import('./pages/contact.astro.mjs');
const _page10 = () => import('./pages/courses.astro.mjs');
const _page11 = () => import('./pages/cv.astro.mjs');
const _page12 = () => import('./pages/education.astro.mjs');
const _page13 = () => import('./pages/en.astro.mjs');
const _page14 = () => import('./pages/experience.astro.mjs');
const _page15 = () => import('./pages/faq.astro.mjs');
const _page16 = () => import('./pages/gallery.astro.mjs');
const _page17 = () => import('./pages/hjemmeside-historie.astro.mjs');
const _page18 = () => import('./pages/kursusstatistik.astro.mjs');
const _page19 = () => import('./pages/map.astro.mjs');
const _page20 = () => import('./pages/media.astro.mjs');
const _page21 = () => import('./pages/notes.astro.mjs');
const _page22 = () => import('./pages/organizations.astro.mjs');
const _page23 = () => import('./pages/podcasts.astro.mjs');
const _page24 = () => import('./pages/portfolio.astro.mjs');
const _page25 = () => import('./pages/quotes.astro.mjs');
const _page26 = () => import('./pages/referencer.astro.mjs');
const _page27 = () => import('./pages/resources.astro.mjs');
const _page28 = () => import('./pages/rss.xml.astro.mjs');
const _page29 = () => import('./pages/search-index.json.astro.mjs');
const _page30 = () => import('./pages/services.astro.mjs');
const _page31 = () => import('./pages/skills.astro.mjs');
const _page32 = () => import('./pages/timeline.astro.mjs');
const _page33 = () => import('./pages/traeningsstatistik.astro.mjs');
const _page34 = () => import('./pages/video-cv.astro.mjs');
const _page35 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/api/chat.ts", _page3],
    ["src/pages/blog.astro", _page4],
    ["src/pages/books.astro", _page5],
    ["src/pages/cases.astro", _page6],
    ["src/pages/certifications.astro", _page7],
    ["src/pages/chat.astro", _page8],
    ["src/pages/contact.astro", _page9],
    ["src/pages/courses.astro", _page10],
    ["src/pages/cv.astro", _page11],
    ["src/pages/education.astro", _page12],
    ["src/pages/en/index.astro", _page13],
    ["src/pages/experience.astro", _page14],
    ["src/pages/faq.astro", _page15],
    ["src/pages/gallery.astro", _page16],
    ["src/pages/hjemmeside-historie.astro", _page17],
    ["src/pages/kursusstatistik.astro", _page18],
    ["src/pages/map.astro", _page19],
    ["src/pages/media.astro", _page20],
    ["src/pages/notes.astro", _page21],
    ["src/pages/organizations.astro", _page22],
    ["src/pages/podcasts.astro", _page23],
    ["src/pages/portfolio.astro", _page24],
    ["src/pages/quotes.astro", _page25],
    ["src/pages/referencer.astro", _page26],
    ["src/pages/resources.astro", _page27],
    ["src/pages/rss.xml.js", _page28],
    ["src/pages/search-index.json.ts", _page29],
    ["src/pages/services.astro", _page30],
    ["src/pages/skills.astro", _page31],
    ["src/pages/timeline.astro", _page32],
    ["src/pages/traeningsstatistik.astro", _page33],
    ["src/pages/video-cv.astro", _page34],
    ["src/pages/index.astro", _page35]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "9763a87d-8fc3-4f5c-bacb-7047d26693d0",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
