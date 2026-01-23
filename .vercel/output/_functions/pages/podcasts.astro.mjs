import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { $ as $$Card, a as $$Section, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$Pill } from '../chunks/Pill_BHOYW9nv.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
/* empty css                                    */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://antonebsen.dk");
const $$PodcastCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$PodcastCard;
  const { title, tag, reason, description, links } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": "bordered", "class": "flex flex-col h-full bg-[rgba(17,24,39,0.02)]!" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex justify-between items-start mb-2 gap-2"> <h3 class="text-[16px] font-bold leading-tight m-0">${title}</h3> ${renderComponent($$result2, "Pill", $$Pill, { "variant": "accent", "class": "shrink-0" }, { "default": ($$result3) => renderTemplate`${tag}` })} </div> <div class="mb-3"> <strong class="text-[var(--accent)] text-xs uppercase tracking-wide block mb-1">Hvorfor jeg hører den:</strong> <p class="text-[14px] text-[var(--text-dim)] m-0 leading-relaxed">${reason}</p> </div> <div class="mb-4 flex-grow"> <strong class="text-[var(--text-dim)] text-xs uppercase tracking-wide block mb-1 opacity-70">Beskrivelse:</strong> <p class="text-[13px] text-[var(--text-dim)] m-0 opacity-80 leading-relaxed">${description}</p> </div> ${links && renderTemplate`<div class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-[var(--glass-border)]"> ${links.map((link) => renderTemplate`<a${addAttribute(link.url, "href")}${addAttribute([
    "text-xs font-bold transition-colors inline-flex items-center",
    link.disabled ? "opacity-50 cursor-not-allowed text-[var(--text-dim)]" : "text-[var(--accent)] hover:text-white"
  ], "class:list")}${addAttribute(link.disabled, "aria-disabled")}> ${link.icon && renderTemplate`<i${addAttribute([link.icon, "mr-1.5"], "class:list")}></i>`} ${link.label} </a>`)} </div>`}` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/resources/PodcastCard.astro", void 0);

const macro = [{"title":"[Podcastnavn]","tag":"Makro","reason":"(1 linje)","description":"Hvilke emner dækker den? Hvad er typisk formatet?","links":[{"label":"Spotify","url":"#","icon":"fa-brands fa-spotify","disabled":true},{"label":"Apple","url":"#","icon":"fa-brands fa-apple","disabled":true}]},{"title":"[Podcastnavn]","tag":"Makro","reason":"(1 linje)","description":"(kort, konkret)","links":[{"label":"Spotify","url":"#","icon":"fa-brands fa-spotify","disabled":true}]}];
const podcastsData = {
  macro};

const $$Podcasts = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Favoritpodcasts", "description": "En kurateret liste over mine favoritpodcasts \u2013 makro, data, tr\xE6ning, humor og refleksion.", "bodyClass": "podcasts-page", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="podcasts-wrap" data-astro-cid-5k7fbrfe> <!-- HERO --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-5k7fbrfe": true }, { "default": ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-5k7fbrfe> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result4) => renderTemplate` <p class="text-xs font-extrabold uppercase tracking-widest text-dim mb-3" data-astro-cid-5k7fbrfe>Podcasts</p> <h1 class="text-4xl font-bold leading-tight mb-5" data-astro-cid-5k7fbrfe>Favoritter jeg faktisk hører igen</h1> <p class="text-lg text-dim mb-6" data-astro-cid-5k7fbrfe>
En kurateret liste opdelt efter tema. Jeg opdaterer løbende.
</p> <div class="flex flex-wrap gap-2 mb-8" aria-label="Kategorier" data-astro-cid-5k7fbrfe> ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Makro` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Data/Tech` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Træning` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Humor` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Refleksion` })} </div> <div class="flex flex-wrap gap-3" data-astro-cid-5k7fbrfe> ${renderComponent($$result4, "Button", $$Button, { "href": "#cat-makro", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Se listen` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/contact", "variant": "ghost", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Foreslå en podcast` })} </div> ` })} <div class="hidden md:block" data-astro-cid-5k7fbrfe> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Hvordan jeg vælger` })} <ul class="list-none p-0 m-0 space-y-2 text-sm text-dim" data-astro-cid-5k7fbrfe> <li data-astro-cid-5k7fbrfe>Høj signalværdi (ikke bare “snak”)</li> <li data-astro-cid-5k7fbrfe>Gode gæster / konkret viden</li> <li data-astro-cid-5k7fbrfe>Kan tåle genlyt</li> </ul> ` })} </div> </div> ` })} <!-- KATEGORI: MAKRO --> ${renderComponent($$result2, "Section", $$Section, { "id": "cat-makro", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-5k7fbrfe": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-5k7fbrfe": true }, { "default": ($$result5) => renderTemplate`Makro & pengepolitik` })} <div class="pod-grid" data-astro-cid-5k7fbrfe> ${podcastsData.macro.map((pod) => renderTemplate`${renderComponent($$result4, "PodcastCard", $$PodcastCard, { "title": pod.title, "tag": pod.tag, "reason": pod.reason, "description": pod.description, "links": pod.links || [], "data-astro-cid-5k7fbrfe": true })}`)} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-5k7fbrfe": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "variant": "glass", "title": "Vil du se flere?", "text": "Kontakt mig eller g\xE5 tilbage til oversigten.", "action": "contact", "data-astro-cid-5k7fbrfe": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/podcasts.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/podcasts.astro";
const $$url = "/podcasts";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Podcasts,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
