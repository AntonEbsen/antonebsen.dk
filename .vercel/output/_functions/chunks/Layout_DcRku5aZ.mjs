import { b as createAstro, c as createComponent, m as maybeRenderHead, e as renderScript, a as renderTemplate, d as addAttribute, r as renderComponent, z as renderSlot, B as renderHead } from './astro/server_B2tU-5nP.mjs';
import 'piccolore';
import 'clsx';
import { u as ui, d as defaultLang, n as navigation } from './ui_D20BAPtt.mjs';
/* empty css                         */

function getLangFromUrl(url) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang;
  return defaultLang;
}
function useTranslations(lang) {
  return function t(key) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}
function useNav(lang) {
  return navigation[lang];
}

const $$Astro$4 = createAstro("https://antonebsen.dk");
const $$LanguageSwitcher = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$LanguageSwitcher;
  const lang = getLangFromUrl(Astro2.url);
  const label = lang === "en" ? "Language" : "Sprog";
  return renderTemplate`${maybeRenderHead()}<div class="nav-item has-dropdown lang-switch" data-astro-cid-crzgpmpb> <button type="button" class="nav-link lang-btn" aria-label="Skift sprog" aria-haspopup="true" aria-expanded="false" data-astro-cid-crzgpmpb> ${label} <span aria-hidden="true" data-astro-cid-crzgpmpb>▾</span> </button> <div class="dropdown" role="menu" aria-label="Sprogvalg" data-astro-cid-crzgpmpb> <a href="/" role="menuitem" data-astro-cid-crzgpmpb> <span class="lang-row" data-astro-cid-crzgpmpb> <img src="/assets/img/dansk-flag.png" alt="" class="lang-flag" data-astro-cid-crzgpmpb>
Dansk
</span> </a> <a href="/en" role="menuitem" data-astro-cid-crzgpmpb> <span class="lang-row" data-astro-cid-crzgpmpb> <img src="/assets/img/britisk-flag.png" alt="" class="lang-flag" data-astro-cid-crzgpmpb>
English
</span> </a> <a href="/de" role="menuitem" data-astro-cid-crzgpmpb> <span class="lang-row" data-astro-cid-crzgpmpb> <img src="/assets/img/tysk-flag.png" alt="" class="lang-flag" data-astro-cid-crzgpmpb>
Deutsch
</span> </a> </div> </div> ${renderScript($$result, "C:/Users/Anton/antonebsen.dk/src/components/common/LanguageSwitcher.astro?astro&type=script&index=0&lang.ts")} `;
}, "C:/Users/Anton/antonebsen.dk/src/components/common/LanguageSwitcher.astro", void 0);

const $$Astro$3 = createAstro("https://antonebsen.dk");
const $$Navbar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Navbar;
  const lang = getLangFromUrl(Astro2.url);
  const navItems = useNav(lang);
  const pathname = new URL(Astro2.request.url).pathname;
  return renderTemplate`${maybeRenderHead()}<nav class="navbar" aria-label="Primær navigation"> <div class="nav-inner"> <div class="nav-left"> ${navItems.map((item) => item.children && item.children.length > 0 ? renderTemplate`<div class="nav-item has-dropdown"> <a${addAttribute(item.url, "href")}${addAttribute(`nav-link ${pathname.startsWith(item.url) ? "active" : ""}`, "class")}> ${item.label} <i class="fa-solid fa-chevron-down text-[10px] ml-1.5 opacity-60"></i> </a> <div class="dropdown"> ${item.children.map((child) => renderTemplate`<a${addAttribute(child.url, "href")}${addAttribute(child.external ? "_blank" : "_self", "target")}${addAttribute(child.external ? "noopener noreferrer" : "", "rel")}> ${child.label} ${child.external && renderTemplate`<i class="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1 opacity-50"></i>`} </a>`)} </div> </div>` : renderTemplate`<a${addAttribute(pathname === item.url || pathname.startsWith(item.url + "/") && item.url !== "/" && item.url !== "/en" ? "active" : "", "class")}${addAttribute(item.url, "href")}> ${item.label} </a>`)} </div> <div class="nav-search" role="search"> <label class="sr-only" for="siteSearch">Søg på siden</label> <input id="siteSearch" class="nav-search-input" type="search" placeholder="Søg..." autocomplete="off" aria-autocomplete="list" aria-controls="searchResults" aria-expanded="false"> <div id="searchResults" class="search-results" role="listbox" aria-label="Søgeresultater"></div> </div> <div class="nav-right"> ${renderComponent($$result, "LanguageSwitcher", $$LanguageSwitcher, {})} </div> </div> </nav> ${renderScript($$result, "C:/Users/Anton/antonebsen.dk/src/components/Navbar.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/Navbar.astro", void 0);

const $$Astro$2 = createAstro("https://antonebsen.dk");
const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Footer;
  const lang = getLangFromUrl(Astro2.url);
  const t = useTranslations(lang);
  const navItems = useNav(lang);
  const isEn = lang === "en";
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer class="site-footer" role="contentinfo"> <div class="footer-container"> <div class="footer-top"> <!-- Brand / kort pitch --> <section class="footer-col footer-brand" aria-label="Om siden"> <h2 class="footer-title">${t("footer.brand.title")}</h2> <p class="footer-text"> ${t("footer.brand.text")} </p> <div class="footer-cta"> <a class="footer-btn"${addAttribute(isEn ? "/en/cv" : "/cv", "href")}> <i class="fa-solid fa-file-lines" aria-hidden="true"></i> ${isEn ? "CV" : "CV"} </a> <a class="footer-btn footer-btn-ghost" href="/assets/Anton-CV.pdf" target="_blank" rel="noopener"> <i class="fa-solid fa-download" aria-hidden="true"></i> ${isEn ? "Download PDF" : "Download PDF"} </a> </div> </section> <!-- Navigation --> <nav class="footer-col" aria-label="Footer navigation"> <h3 class="footer-title-sm">${t("footer.col.links")}</h3> <ul class="footer-list"> ${navItems.map((item) => renderTemplate`<li><a${addAttribute(item.url, "href")}>${item.label}</a></li>`)} </ul> </nav> <!-- Udvalgte sider --> <nav class="footer-col" aria-label="Udvalgte sider"> <h3 class="footer-title-sm">${t("footer.col.selected")}</h3> <ul class="footer-list"> <li><a${addAttribute(isEn ? "/en/resources" : "/resources", "href")}>Downloads</a></li> <li><a${addAttribute(isEn ? "/en/gallery" : "/gallery", "href")}>Galleri</a></li> <li><a${addAttribute(isEn ? "/en/timeline" : "/timeline", "href")}>Milepæle</a></li> </ul> </nav> <!-- Kontakt + SoMe --> <section class="footer-col footer-contact" aria-label="Kontakt og profiler"> <h3 class="footer-title-sm">${t("footer.col.contact")}</h3> <address class="footer-text footer-address"> <div class="footer-address-row"> <span class="footer-kicker">Email</span><br> <a href="mailto:anton.ebsen@gmail.com">anton.ebsen@gmail.com</a> </div> <div class="footer-address-row"> <span class="footer-kicker">${isEn ? "Phone" : "Telefon"}</span><br> <a href="tel:+4525740131">+45 25 74 01 31</a> </div> <div class="footer-address-row"> <span class="footer-kicker">${isEn ? "Location" : "Lokation"}</span><br> ${isEn ? "Copenhagen, DK" : "K\xF8benhavn, DK"} </div> </address> <div class="footer-social" aria-label="Sociale links"> <a href="https://www.linkedin.com/in/antonebsen/" target="_blank" rel="noopener" aria-label="LinkedIn"> <i class="fa-brands fa-linkedin" aria-hidden="true"></i> </a> <a href="https://github.com/AntonEbsen" target="_blank" rel="noopener" aria-label="GitHub"> <i class="fa-brands fa-github" aria-hidden="true"></i> </a> </div> </section> </div> <div class="footer-bottom"> <nav class="footer-legal" aria-label="Juridiske sider"> <a href="#">Privacy</a> <span aria-hidden="true">·</span> <a href="#">Terms</a> </nav> <p class="footer-copy">
&copy; ${year} Anton Meier Ebsen Jørgensen. ${isEn ? "All rights reserved." : "Alle rettigheder forbeholdes."} <span class="footer-copy-muted">${isEn ? "Source code:" : "Kildekode:"} <a href="https://github.com/AntonEbsen/antonebsen.dk" target="_blank" rel="noopener">GitHub</a>.
</span> </p> </div> </div> </footer>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/Footer.astro", void 0);

const $$Astro$1 = createAstro("https://antonebsen.dk");
const $$SEO = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SEO;
  const {
    title,
    description = "Anton Meier Ebsen J\xF8rgensen \u2013 \xD8konomistuderende (cand.polit.)",
    image = "/assets/img/billede-af-mig.jpg",
    article = false
  } = Astro2.props;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site || "https://antonebsen.dk");
  const socialImageURL = new URL(image, Astro2.url);
  const siteTitle = "Anton Meier Ebsen J\xF8rgensen";
  const pageTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;
  return renderTemplate`<!-- Global Metadata --><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" href="/assets/img/favicon.ico" type="image/x-icon"><meta name="generator"${addAttribute(Astro2.generator, "content")}><!-- Canonical URL --><link rel="canonical"${addAttribute(canonicalURL, "href")}><!-- Primary Meta Tags --><title>${pageTitle}</title><meta name="title"${addAttribute(pageTitle, "content")}><meta name="description"${addAttribute(description, "content")}><!-- Open Graph / Facebook --><meta property="og:type"${addAttribute(article ? "article" : "website", "content")}><meta property="og:url"${addAttribute(Astro2.url, "content")}><meta property="og:title"${addAttribute(pageTitle, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(socialImageURL, "content")}><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"${addAttribute(Astro2.url, "content")}><meta property="twitter:title"${addAttribute(pageTitle, "content")}><meta property="twitter:description"${addAttribute(description, "content")}><meta property="twitter:image"${addAttribute(socialImageURL, "content")}>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/SEO.astro", void 0);

const $$ChatWidget = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div id="chat-widget" class="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none"> <!-- Chat Window --> <div id="chat-window" class="w-[350px] h-[500px] mb-4 bg-glass border border-glass-border rounded-xl shadow-2xl flex flex-col transform translate-y-10 opacity-0 pointer-events-auto transition-all duration-300 origin-bottom-right hidden"> <!-- Header --> <div class="p-4 border-b border-glass-border flex justify-between items-center bg-accent/5 rounded-t-xl"> <div class="flex items-center gap-3"> <div class="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center"> <i class="fa-solid fa-robot"></i> </div> <div> <h3 class="font-bold text-sm">Anton's AI</h3> <p class="text-[10px] text-accent flex items-center gap-1"> <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
</p> </div> </div> <button id="close-chat" class="text-dim hover:text-white transition-colors"> <i class="fa-solid fa-xmark"></i> </button> </div> <!-- Messages --> <div id="chat-messages" class="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide text-sm"> <div class="flex gap-2"> <div class="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-[10px] text-accent mt-1"> <i class="fa-solid fa-robot"></i> </div> <div class="bg-glass-border/50 p-3 rounded-lg rounded-tl-none max-w-[85%]"> <p>Hi! I'm Anton's AI assistant. Ask me anything about his experience, skills, or projects!</p> </div> </div> <!-- Messages will appear here --> </div> <!-- Input --> <div class="p-3 border-t border-glass-border bg-glass/50 rounded-b-xl"> <form id="chat-form" class="flex gap-2"> <input type="text" id="chat-input" placeholder="Ask a question..." class="flex-1 bg-bg/50 border border-glass-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 transition-colors placeholder:text-dim/50" autocomplete="off"> <button type="submit" class="bg-accent text-bg w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white transition-colors"> <i class="fa-solid fa-paper-plane text-xs"></i> </button> </form> <div class="text-[10px] text-center text-dim/30 mt-2">
Powered by AI · May produce inaccuracies
</div> </div> </div> <!-- Toggle Button --> <button id="chat-toggle" class="pointer-events-auto w-14 h-14 bg-accent text-bg rounded-full shadow-lg shadow-accent/20 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 group"> <i class="fa-solid fa-message text-xl group-hover:scale-110 transition-transform"></i> </button> </div> ${renderScript($$result, "C:/Users/Anton/antonebsen.dk/src/components/common/ChatWidget.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/common/ChatWidget.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://antonebsen.dk");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title, description, image, article, bodyClass = "" } = Astro2.props;
  const lang = getLangFromUrl(Astro2.url);
  return renderTemplate(_a || (_a = __template(["<html", "> <head>", '<meta name="design-version" content="dark-gold-v1"><!-- <title>{title}</title> --><!-- Fonts & Icons --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"><!-- Scripts --><script src="/assets/js/search.js" defer><\/script><script src="/assets/js/themes.js" defer><\/script>', "", "</head> <body", "> ", " ", " ", " ", " </body></html>"])), addAttribute(lang, "lang"), renderComponent($$result, "SEO", $$SEO, { "title": title, "description": description, "image": image, "article": article }), renderSlot($$result, $$slots["head"]), renderHead(), addAttribute(bodyClass, "class"), renderComponent($$result, "Navbar", $$Navbar, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, {}), renderComponent($$result, "ChatWidget", $$ChatWidget, {}));
}, "C:/Users/Anton/antonebsen.dk/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
