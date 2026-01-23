import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, C as Fragment } from './astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Card, b as $$Button } from './Button_DQcS6BLE.mjs';

const $$Astro = createAstro("https://antonebsen.dk");
const $$ContactCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ContactCard;
  const {
    title = "Mere",
    text = "Jeg opdaterer l\xF8bende portef\xF8ljen. Du kan ogs\xE5 finde mere p\xE5 GitHub og LinkedIn.",
    variant = "glass",
    action = "socials",
    lang = "da"
  } = Astro2.props;
  const isEn = lang === "en";
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": variant, "class": "p-6" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h2 class="text-xs font-bold uppercase tracking-wider text-accent mb-4">${title}</h2> ${action === "socials" ? renderTemplate`<p class="text-dim opacity-80 m-0"> ${text} <br class="hidden md:block"> <span class="inline-flex gap-4 mt-2"> <a href="https://github.com/AntonEbsen" target="_blank" rel="noopener" class="text-accent font-bold no-underline hover:text-white transition-colors">GitHub</a> <a href="https://www.linkedin.com/in/antonebsen/" target="_blank" rel="noopener" class="text-accent font-bold no-underline hover:text-white transition-colors">LinkedIn</a> </span> </p>` : action === "email" ? renderTemplate`<p class="text-dim opacity-70 mb-6">${text}</p>
      <div class="flex flex-wrap gap-3"> ${renderComponent($$result2, "Button", $$Button, { "href": `mailto:anton.ebsen@gmail.com` }, { "default": ($$result3) => renderTemplate`Email` })} ${renderComponent($$result2, "Button", $$Button, { "href": isEn ? "/en/contact" : "/contact", "variant": "ghost" }, { "default": ($$result3) => renderTemplate`${isEn ? "Contact" : "Kontakt"}` })} </div>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate` <p class="text-dim opacity-70 mb-6">${text}</p> <div class="flex flex-wrap gap-3"> ${renderComponent($$result3, "Button", $$Button, { "href": isEn ? "/en/contact" : "/contact" }, { "default": ($$result4) => renderTemplate`<i class="fa-solid fa-envelope mr-2"></i> ${isEn ? "Contact" : "Kontakt"}` })} ${renderComponent($$result3, "Button", $$Button, { "href": isEn ? "/en/services" : "/services", "variant": "ghost" }, { "default": ($$result4) => renderTemplate`<i class="fa-solid fa-handshake mr-2"></i> ${isEn ? "Services" : "Samarbejde"}` })} </div> ` })}`}` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/common/ContactCard.astro", void 0);

export { $$ContactCard as $ };
