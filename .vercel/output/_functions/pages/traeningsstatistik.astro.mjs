import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
export { renderers } from '../renderers.mjs';

const $$Traeningsstatistik = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Tr\xE6ningsstatistik \u2013 Anton Meier Ebsen J\xF8rgensen", "description": "Dashboard over min tr\xE6ningsprogression, volumen og PRs." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-12"> ${renderComponent($$result2, "Section", $$Section, { "class": "max-w-4xl mx-auto" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-12 text-center" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "class": "mb-6" }, { "default": ($$result5) => renderTemplate`Træning` })} <h1 class="text-4xl font-bold mb-6">Træningsstatistik</h1> <p class="text-xl text-dim mb-8 max-w-2xl mx-auto">
Jeg nørder data - også i fitnesscenteret. Denne side vil snart vise live-opdaterede grafer over 
          volumen, intensitet og progression hentet fra min træningslog.
</p> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left"> <div class="p-4 bg-glass border border-glass-border rounded-xl"> <span class="text-xs uppercase text-accent font-bold">Volumen (Uge)</span> <div class="text-2xl font-bold mt-1">45.2 tons</div> </div> <div class="p-4 bg-glass border border-glass-border rounded-xl"> <span class="text-xs uppercase text-accent font-bold">Sessions</span> <div class="text-2xl font-bold mt-1">6 / uge</div> </div> <div class="p-4 bg-glass border border-glass-border rounded-xl"> <span class="text-xs uppercase text-accent font-bold">Fokus</span> <div class="text-2xl font-bold mt-1">Hypertrofi</div> </div> </div> <div class="flex justify-center gap-4"> ${renderComponent($$result4, "Button", $$Button, { "href": "/blog" }, { "default": ($$result5) => renderTemplate`Læs om min tilgang` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/", "variant": "ghost" }, { "default": ($$result5) => renderTemplate`Tilbage til forsiden` })} </div> ` })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/traeningsstatistik.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/traeningsstatistik.astro";
const $$url = "/traeningsstatistik";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Traeningsstatistik,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
