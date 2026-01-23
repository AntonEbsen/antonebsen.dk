import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { $ as $$Pill } from '../chunks/Pill_BHOYW9nv.mjs';
import { $ as $$Card, a as $$Section, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
import { g as getCollection } from '../chunks/_astro_content_BKcjA1Dz.mjs';
/* empty css                                     */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://antonebsen.dk");
const $$ProjectCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProjectCard;
  const { title, tags, tagString, description, tools, output, links } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": "bordered", "class": "flex flex-col h-full bg-[rgba(17,24,39,0.02)]" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex justify-between items-start mb-2 gap-2"> <h2 class="text-[16px] font-bold leading-tight m-0">${title}</h2> ${tagString && renderTemplate`${renderComponent($$result2, "Pill", $$Pill, { "variant": "accent", "class": "shrink-0" }, { "default": ($$result3) => renderTemplate`${tagString}` })}`} </div> <p class="text-[14px] text-dim flex-grow mb-4 leading-relaxed opacity-90"> ${description} </p> <div class="flex flex-col gap-1 mb-4 text-[13px] text-dim"> ${tools && renderTemplate`<span><strong class="text-text">Værktøjer:</strong> ${tools}</span>`} ${output && renderTemplate`<span><strong class="text-text">Output:</strong> ${output}</span>`} </div> ${links && renderTemplate`<div class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-[var(--glass-border)]"> ${links.map((link) => renderTemplate`<a${addAttribute(link.url, "href")}${addAttribute([
    "text-xs font-bold transition-colors inline-flex items-center",
    link.disabled ? "opacity-50 cursor-not-allowed text-dim" : "text-accent hover:text-white"
  ], "class:list")}${addAttribute(link.disabled, "aria-disabled")}> ${link.label} </a>`)} </div>`}` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/portfolio/ProjectCard.astro", void 0);

const $$Portfolio = createComponent(async ($$result, $$props, $$slots) => {
  const portfolioData = await getCollection("portfolio");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Portef\xF8lje", "description": "Portef\xF8lje med udvalgte projekter inden for makro\xF8konomi, \xF8konometri og \xF8konomiske modeller. Python, SAS, GAMS og Excel/VBA.", "bodyClass": "portfolio-page", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="portfolio-wrap" data-astro-cid-hcjuqwdu> <!-- HERO --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-hcjuqwdu> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result4) => renderTemplate` <p class="text-xs font-extrabold uppercase tracking-widest text-dim mb-3" data-astro-cid-hcjuqwdu>Portefølje</p> <h1 class="text-4xl leading-[1.15] mb-5 font-bold" data-astro-cid-hcjuqwdu>Udvalgte projekter</h1> <p class="text-[17px] leading-relaxed text-dim mb-6 opacity-90" data-astro-cid-hcjuqwdu>
Her finder du projekter inden for makroøkonomi, økonometri, tidsrækker og modellering.
              Jeg lægger især vægt på reproducerbar analyse, klare resultater og pæn formidling.
</p> <div class="flex flex-wrap gap-3 mb-6" data-astro-cid-hcjuqwdu> ${renderComponent($$result4, "Button", $$Button, { "href": "/cv", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result5) => renderTemplate`Se CV` })} ${renderComponent($$result4, "Button", $$Button, { "href": "https://github.com/AntonEbsen", "target": "_blank", "rel": "noopener", "variant": "ghost", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result5) => renderTemplate`<i class="fa-brands fa-github mr-2" data-astro-cid-hcjuqwdu></i> GitHub` })} ${renderComponent($$result4, "Button", $$Button, { "href": "https://www.linkedin.com/in/antonebsen/", "target": "_blank", "rel": "noopener", "variant": "ghost", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result5) => renderTemplate`<i class="fa-brands fa-linkedin mr-2" data-astro-cid-hcjuqwdu></i> LinkedIn` })} </div> <div class="flex flex-wrap gap-2" data-astro-cid-hcjuqwdu> ${["Makro & pengepolitik", "Tidsr\xE6kker", "CGE/RBC", "Python", "SAS", "GAMS", "Excel/VBA"].map((pill) => renderTemplate`${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result5) => renderTemplate`${pill}` })}`)} </div> ` })} <div class="hidden md:block" data-astro-cid-hcjuqwdu> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result5) => renderTemplate`Sådan er projekterne bygget` })} <ul class="list-none p-0 m-0 space-y-2 text-sm text-dim opacity-90" data-astro-cid-hcjuqwdu> <li class="relative pl-4 before:content-['-'] before:absolute before:left-0 before:text-accent" data-astro-cid-hcjuqwdu>Kort problemformulering</li> <li class="relative pl-4 before:content-['-'] before:absolute before:left-0 before:text-accent" data-astro-cid-hcjuqwdu>Metode (model/økonometri)</li> <li class="relative pl-4 before:content-['-'] before:absolute before:left-0 before:text-accent" data-astro-cid-hcjuqwdu>Data & kode (hvis muligt)</li> <li class="relative pl-4 before:content-['-'] before:absolute before:left-0 before:text-accent" data-astro-cid-hcjuqwdu>Resultater og læring</li> </ul> ` })} </div> </div> ` })} <!-- PROJECT GRID --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result3) => renderTemplate` <div class="projects-grid" data-astro-cid-hcjuqwdu> ${portfolioData.map((project) => renderTemplate`${renderComponent($$result3, "ProjectCard", $$ProjectCard, { "title": project.data.title, "tagString": project.data.tagString, "description": project.data.description, "tools": project.data.tools, "output": project.data.output, "links": project.data.links || [], "data-astro-cid-hcjuqwdu": true })}`)} </div> ` })} <!-- Footer card --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-hcjuqwdu": true }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "data-astro-cid-hcjuqwdu": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/portfolio.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/portfolio.astro";
const $$url = "/portfolio";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Portfolio,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
