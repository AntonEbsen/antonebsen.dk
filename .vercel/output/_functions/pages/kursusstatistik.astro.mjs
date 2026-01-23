import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
export { renderers } from '../renderers.mjs';

const $$Kursusstatistik = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Kursusstatistik \u2013 Anton Meier Ebsen J\xF8rgensen", "description": "Oversigt over evalueringer og n\xF8gletal fra min undervisning i Excel og VBA." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-12"> ${renderComponent($$result2, "Section", $$Section, { "class": "max-w-4xl mx-auto" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-12 text-center" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "class": "mb-6" }, { "default": ($$result5) => renderTemplate`Kursusstatistik` })} <h1 class="text-4xl font-bold mb-6">Undervisningsevalueringer</h1> <p class="text-xl text-dim mb-8 max-w-2xl mx-auto">
Denne side er under udarbejdelse. Her vil jeg præsentere aggregerede data fra mine kursusevalueringer, 
          inklusive score-fordeling, deltagerfeedback og udvikling over tid.
</p> <div class="p-6 bg-accent/5 rounded-xl border border-accent/10 mb-8 inline-block text-left"> <h3 class="font-bold mb-3 flex items-center gap-2"> <i class="fa-solid fa-check-circle text-accent"></i>
Nøgletal (Preview)
</h3> <ul class="space-y-2 text-dim text-sm"> <li>• Gennemsnitlig score: <strong>4.8 / 5.0</strong></li> <li>• Antal kursister: <strong>500+</strong></li> <li>• Primære emner: <strong>Excel, VBA, Power Query</strong></li> </ul> </div> <div class="flex justify-center gap-4"> ${renderComponent($$result4, "Button", $$Button, { "href": "/contact" }, { "default": ($$result5) => renderTemplate`Kontakt mig for detaljer` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/experience", "variant": "ghost" }, { "default": ($$result5) => renderTemplate`Se erhvervserfaring` })} </div> ` })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/kursusstatistik.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/kursusstatistik.astro";
const $$url = "/kursusstatistik";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Kursusstatistik,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
