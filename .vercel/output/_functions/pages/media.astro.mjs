import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Media = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Omtale", "description": "Omtale, artikler og medieoptr\xE6dener: udvalgte links og highlights.", "bodyClass": "media-page", "data-astro-cid-h6iffge2": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="media-wrap" data-astro-cid-h6iffge2> ${renderComponent($$result2, "Section", $$Section, { "class": "mb-12", "data-astro-cid-h6iffge2": true }, { "default": ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-h6iffge2> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-h6iffge2": true }, { "default": ($$result4) => renderTemplate` <p class="text-xs font-bold uppercase tracking-widest text-accent mb-3" data-astro-cid-h6iffge2>Omtale</p> <h1 class="text-4xl font-bold leading-tight mb-4" data-astro-cid-h6iffge2>Artikler & omtaler</h1> <p class="text-lg text-dim mb-6" data-astro-cid-h6iffge2>
Udvalgte steder, hvor jeg er blevet omtalt – samt links og korte highlights.
</p> <div class="flex flex-wrap gap-3" data-astro-cid-h6iffge2> <a href="#press" class="px-6 py-2 bg-accent text-black rounded-full font-bold" data-astro-cid-h6iffge2>Pressekit</a> <a href="/contact" class="px-6 py-2 border border-accent text-accent rounded-full font-bold" data-astro-cid-h6iffge2>Kontakt</a> </div> ` })} </div> ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "mentions", "class": "mb-20", "data-astro-cid-h6iffge2": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-h6iffge2": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-h6iffge2": true }, { "default": ($$result5) => renderTemplate`Udvalgte omtaler` })} <div class="mentions-grid" data-astro-cid-h6iffge2> ${renderComponent($$result4, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-h6iffge2": true }, { "default": ($$result5) => renderTemplate` <h3 class="font-bold mb-2" data-astro-cid-h6iffge2>Artikel i [Medie]</h3> <p class="text-sm text-dim mb-4" data-astro-cid-h6iffge2>Omkring [Emne] og betydningen for [Kategori].</p> <a href="#" class="text-accent font-bold" data-astro-cid-h6iffge2>Læs artikel →</a> ` })} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-h6iffge2": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "data-astro-cid-h6iffge2": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/media.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/media.astro";
const $$url = "/media";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Media,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
