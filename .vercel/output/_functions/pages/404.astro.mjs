import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
/* empty css                               */
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "404 \u2013 Siden findes ikke", "description": "Siden findes ikke", "bodyClass": "notfound-page", "data-astro-cid-zetdm5md": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="notfound-wrap" data-astro-cid-zetdm5md> <section class="card notfound-card" aria-label="404 indhold" data-astro-cid-zetdm5md> <p class="eyebrow" data-astro-cid-zetdm5md>404</p> <h1 data-astro-cid-zetdm5md>Siden findes ikke</h1> <p class="lead" data-astro-cid-zetdm5md>
Den side du prøvede at åbne, findes ikke (eller er flyttet).
</p> <div class="quick" data-astro-cid-zetdm5md> <a class="btn" href="/" data-astro-cid-zetdm5md>Til forsiden</a> <a class="btn ghost" href="/portfolio" data-astro-cid-zetdm5md>Portefølje</a> <a class="btn ghost" href="/blog" data-astro-cid-zetdm5md>Blog</a> <a class="btn ghost" href="/contact" data-astro-cid-zetdm5md>Kontakt</a> </div> <div class="help" data-astro-cid-zetdm5md> <p class="muted" style="margin:0;" data-astro-cid-zetdm5md>
Tip: tjek URL’en for en stavefejl — eller brug menuen ovenfor.
</p> </div> </section> </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/404.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
