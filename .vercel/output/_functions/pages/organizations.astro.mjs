import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
import { c as cv } from '../chunks/cv_Bdw7tsR6.mjs';
/* empty css                                         */
export { renderers } from '../renderers.mjs';

const $$Organizations = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 Organisationer", "description": "Organisationer og foreninger: roller, ansvar og engagement.", "bodyClass": "organizations-page", "data-astro-cid-rbttmkam": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="orgs-wrap" data-astro-cid-rbttmkam> ${renderComponent($$result2, "Section", $$Section, { "class": "mb-12", "data-astro-cid-rbttmkam": true }, { "default": ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-rbttmkam> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-rbttmkam": true }, { "default": ($$result4) => renderTemplate` <p class="text-xs font-bold uppercase tracking-widest text-accent mb-3" data-astro-cid-rbttmkam>Organisationer</p> <h1 class="text-4xl font-bold leading-tight mb-4" data-astro-cid-rbttmkam>Foreninger, roller og ansvar</h1> <p class="text-lg text-dim" data-astro-cid-rbttmkam>
Her samler jeg organisationer og foreninger jeg er tilknyttet.
</p> ` })} </div> ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "orgs", "class": "mb-20", "data-astro-cid-rbttmkam": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-rbttmkam": true }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-rbttmkam": true }, { "default": ($$result5) => renderTemplate`Mine roller` })} <div class="orgs-grid" data-astro-cid-rbttmkam> ${cv.organizations.map((org) => renderTemplate`${renderComponent($$result4, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-rbttmkam": true }, { "default": ($$result5) => renderTemplate` <h3 class="font-bold mb-2" data-astro-cid-rbttmkam>${org.name}</h3> <p class="text-xs text-accent font-bold mb-3" data-astro-cid-rbttmkam>${org.role} · ${org.period}</p> <p class="text-sm text-dim" data-astro-cid-rbttmkam>${org.description}</p> ` })}`)} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-rbttmkam": true }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "data-astro-cid-rbttmkam": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/organizations.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/organizations.astro";
const $$url = "/organizations";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Organizations,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
