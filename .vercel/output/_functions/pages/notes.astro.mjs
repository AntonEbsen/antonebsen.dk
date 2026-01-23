import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Notes = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Publikationer & Noter", "description": "Publikationer, working notes og korte one-pagers om \xF8konomi, data og modeller.", "bodyClass": "notes-page", "data-astro-cid-42n6zz5n": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="notes-wrap" data-astro-cid-42n6zz5n> ${renderComponent($$result2, "Section", $$Section, { "class": "mb-12", "data-astro-cid-42n6zz5n": true }, { "default": ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-42n6zz5n> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-42n6zz5n": true }, { "default": ($$result4) => renderTemplate` <p class="text-xs font-bold uppercase tracking-widest text-accent mb-3" data-astro-cid-42n6zz5n>Publikationer / Noter</p> <h1 class="text-4xl font-bold leading-tight mb-4" data-astro-cid-42n6zz5n>Korte writeups og materiale</h1> <p class="text-lg text-dim" data-astro-cid-42n6zz5n>
Her samler jeg ting, der er mere “arkiv og reference” end blog: one-pagers, slides og arbejdsnoter.
</p> ` })} </div> ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "noter", "class": "mb-20", "data-astro-cid-42n6zz5n": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-42n6zz5n": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-42n6zz5n": true }, { "default": ($$result5) => renderTemplate`Noter` })} <div class="notes-grid" data-astro-cid-42n6zz5n> ${renderComponent($$result4, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-42n6zz5n": true }, { "default": ($$result5) => renderTemplate` <h3 class="font-bold mb-2" data-astro-cid-42n6zz5n>Template: Data → Leverance</h3> <p class="text-sm text-dim mb-4" data-astro-cid-42n6zz5n>En enkel struktur jeg bruger til analyseprojekter.</p> <a href="#" class="text-accent font-bold" data-astro-cid-42n6zz5n>Læs note →</a> ` })} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-42n6zz5n": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "data-astro-cid-42n6zz5n": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/notes.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/notes.astro";
const $$url = "/notes";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Notes,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
