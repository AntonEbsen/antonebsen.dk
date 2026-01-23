import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { c as cv } from '../chunks/cv_Bdw7tsR6.mjs';
import { $ as $$Card, a as $$Section, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$Pill } from '../chunks/Pill_BHOYW9nv.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
/* empty css                                      */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://antonebsen.dk");
const $$ExperienceCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ExperienceCard;
  const {
    title,
    organization,
    location,
    period,
    type,
    description,
    highlights,
    links
  } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": "bordered", "class": "flex flex-col h-full bg-glass" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex justify-between items-start mb-4 gap-3"> <div> <h3 class="text-base font-bold leading-tight m-0">${title} · ${organization}</h3> <p class="text-[13px] text-dim mt-1 m-0">${location} · ${period}</p> </div> ${type && renderTemplate`${renderComponent($$result2, "Pill", $$Pill, { "variant": "accent" }, { "default": ($$result3) => renderTemplate`${type}` })}`} </div> <ul class="list-none p-0 m-0 pl-4 space-y-2 text-[14.5px] mb-6 flex-grow"> ${description.map((item) => renderTemplate`<li class="relative before:content-['-'] before:absolute before:-left-4 before:text-accent">${item}</li>`)} </ul> <div class="grid grid-cols-1 gap-3 mb-6"> ${highlights && highlights.map((h) => renderTemplate`<div class="rounded-xl p-3 bg-glass border border-glass-border"> <span class="block text-xs font-bold text-dim mb-1">${h.label}</span> <span class="block text-sm text-text">${h.value}</span> </div>`)} </div> ${links && links.length > 0 && renderTemplate`<div class="flex flex-wrap gap-2 mt-auto"> ${links.map((link) => renderTemplate`<a${addAttribute(link.href, "href")} class="text-xs font-bold border border-glass-border text-white px-3 py-2 rounded-full hover:bg-accent hover:text-white no-underline inline-flex items-center transition-all"> ${link.icon && renderTemplate`<i${addAttribute(["fa-solid", link.icon, "mr-1.5"], "class:list")}></i>`} ${link.text} </a>`)} </div>`}` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/experience/ExperienceCard.astro", void 0);

const $$Experience = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Erhvervserfaring", "description": "Erhvervserfaring: undervisning, data og analyse. Rollen, ansvar, resultater og v\xE6rkt\xF8jer.", "bodyClass": "experience-page", "data-astro-cid-ajxctdaq": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="experience-wrap" data-astro-cid-ajxctdaq> <!-- HERO --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-ajxctdaq> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-ajxctdaq": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "class": "text-dim mb-3", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Erhvervserfaring` })} <h1 class="text-4xl leading-tight mb-4 font-bold" data-astro-cid-ajxctdaq>Undervisning, data og leverancer – i praksis</h1> <p class="text-lg leading-relaxed text-dim mb-6" data-astro-cid-ajxctdaq>
Her er min erhvervserfaring samlet i et format, der er let at skimme:
            rolle → ansvar → resultater → værktøjer. (No fluff, kun signal.)
</p> <div class="flex flex-wrap gap-2 mb-6" aria-label="Nøglekompetencer" data-astro-cid-ajxctdaq> ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Undervisning` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Excel/VBA` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Data & analyse` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Formidling` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Struktur & kvalitet` })} </div> <div class="flex flex-wrap gap-3" data-astro-cid-ajxctdaq> ${renderComponent($$result4, "Button", $$Button, { "href": "#roles", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`<i class="fa-solid fa-briefcase mr-2" data-astro-cid-ajxctdaq></i> Se roller` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/kursusstatistik", "variant": "ghost", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`<i class="fa-solid fa-chart-column mr-2" data-astro-cid-ajxctdaq></i> Kursusstatistik` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/contact", "variant": "ghost", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`<i class="fa-solid fa-envelope mr-2" data-astro-cid-ajxctdaq></i> Kontakt` })} </div> ` })} <div class="hidden md:block" data-astro-cid-ajxctdaq> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-4", "data-astro-cid-ajxctdaq": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Kort version` })} <ul class="list-none p-0 m-0 space-y-2 text-dim text-[14px]" data-astro-cid-ajxctdaq> <li data-astro-cid-ajxctdaq>Excel/VBA-underviser med stærke evalueringer</li> <li data-astro-cid-ajxctdaq>Bygger materialer og workflows, der kan genbruges</li> <li data-astro-cid-ajxctdaq>Trives i deadlines og “delivery mode”</li> </ul> ` })} </div> </div> ` })} <!-- ROLLER --> ${renderComponent($$result2, "Section", $$Section, { "id": "roles", "aria-label": "Roller", "data-astro-cid-ajxctdaq": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-ajxctdaq": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Roller` })} <div class="roles-grid" data-astro-cid-ajxctdaq> ${cv.experience.map((role) => renderTemplate`${renderComponent($$result4, "ExperienceCard", $$ExperienceCard, { "title": role.title, "organization": role.organization, "location": role.location, "period": role.period, "type": role.type, "description": role.description, "highlights": role.highlights, "links": role.links, "data-astro-cid-ajxctdaq": true })}`)} </div> ` })} ` })} <!-- HOW I WORK --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-ajxctdaq": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate`Hvordan jeg typisk arbejder` })} <div class="process-grid" data-astro-cid-ajxctdaq> ${[
    { step: "1) Afklar m\xE5l", desc: "Hvad er outputtet? Hvem er modtageren? Hvad er \u201Cdone\u201D?" },
    { step: "2) Data & kontekst", desc: "Input, constraints, antagelser. Hellere klarhed end magi." },
    { step: "3) Metode", desc: "V\xE6lg det simplest mulige, der stadig er korrekt." },
    { step: "4) Formidling & leverance", desc: "Tydeligt output: struktur, noter, og \u201Chvad betyder det?\u201D" }
  ].map((item) => renderTemplate`${renderComponent($$result4, "Card", $$Card, { "variant": "bordered", "class": "p-4 bg-glass", "data-astro-cid-ajxctdaq": true }, { "default": ($$result5) => renderTemplate` <h3 class="text-[15px] font-bold m-0 mb-2" data-astro-cid-ajxctdaq>${item.step}</h3> <p class="text-[13px] text-dim m-0 opacity-80 leading-relaxed" data-astro-cid-ajxctdaq>${item.desc}</p> ` })}`)} </div> ` })} ` })} <!-- CTA --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-ajxctdaq": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "variant": "default", "title": "Vil du samarbejde?", "text": "Hvis du har et konkret behov (undervisning, templates, dataarbejde), s\xE5 skriv kort.", "action": "contact", "data-astro-cid-ajxctdaq": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/experience.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/experience.astro";
const $$url = "/experience";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Experience,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
