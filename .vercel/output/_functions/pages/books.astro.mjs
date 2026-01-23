import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { $ as $$Card, a as $$Section, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$Pill } from '../chunks/Pill_BHOYW9nv.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$ContactCard } from '../chunks/ContactCard_ut8ak_kp.mjs';
import { g as getCollection } from '../chunks/_astro_content_BKcjA1Dz.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://antonebsen.dk");
const $$BookCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BookCard;
  const { title, author, year, genre, tag, note, links } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": "bordered", "class": "flex flex-col h-full bg-[rgba(17,24,39,0.02)]" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex justify-between items-start mb-2 gap-2"> <h3 class="text-[16px] font-bold leading-tight m-0">${title}</h3> ${tag && renderTemplate`${renderComponent($$result2, "Pill", $$Pill, { "variant": "accent", "class": "shrink-0" }, { "default": ($$result3) => renderTemplate`${tag}` })}`} </div> <p class="text-[13px] text-dim mb-3 opacity-90"> ${author} ${year && `\xB7 (${year})`} ${genre && `\xB7 ${genre}`} </p> <p class="text-[14px] text-dim flex-grow mb-4 leading-relaxed"> <strong class="text-accent text-xs uppercase tracking-wide block mb-1">Min note:</strong> ${note} </p> ${links && renderTemplate`<div class="flex flex-wrap gap-2 mt-auto pt-3 border-t border-[var(--glass-border)]"> ${links.map((link) => renderTemplate`<a${addAttribute(link.url, "href")}${addAttribute([
    "text-xs font-bold transition-colors inline-flex items-center",
    link.disabled ? "opacity-50 cursor-not-allowed text-dim" : "text-accent hover:text-white"
  ], "class:list")}${addAttribute(link.disabled, "aria-disabled")}> ${link.icon && renderTemplate`<i${addAttribute([link.icon, "mr-1.5"], "class:list")}></i>`} ${link.label} </a>`)} </div>`}` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/resources/BookCard.astro", void 0);

const $$Books = createComponent(async ($$result, $$props, $$slots) => {
  const booksData = await getCollection("books");
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Favoritb\xF8ger \u2013 Anton Meier Ebsen J\xF8rgensen", "description": "En kurateret liste med mine favoritb\xF8ger \u2013 klassikere, faglige b\xF8ger og b\xF8ger jeg vender tilbage til.", "bodyClass": "books-page", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<main class="books-wrap" data-astro-cid-xglhyxzr> <!-- HERO --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-xglhyxzr": true }, { "default": async ($$result3) => renderTemplate` <div class="hero-grid" data-astro-cid-xglhyxzr> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result4) => renderTemplate` <p class="text-xs font-extrabold uppercase tracking-widest text-dim mb-3" data-astro-cid-xglhyxzr>Om mig · Læseliste</p> <h1 class="text-4xl leading-[1.15] mb-5 font-bold" data-astro-cid-xglhyxzr>Mine favoritbøger</h1> <p class="text-[17px] leading-relaxed text-dim mb-6 opacity-90" data-astro-cid-xglhyxzr>
En kurateret liste med bøger jeg har fået mest ud af — enten fordi de har formet min måde at tænke på,
            eller fordi jeg vender tilbage til dem igen og igen.
</p> <div class="flex flex-wrap gap-2 mb-8" aria-label="Kategorier" data-astro-cid-xglhyxzr> ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Klassikere` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Fagligt` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Biografier` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Tro & etik` })} ${renderComponent($$result4, "Pill", $$Pill, { "variant": "accent", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Sprog & skrivning` })} </div> <div class="flex flex-wrap gap-3" data-astro-cid-xglhyxzr> ${renderComponent($$result4, "Button", $$Button, { "href": "#list", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`<i class="fa-solid fa-book mr-2" data-astro-cid-xglhyxzr></i> Se listen` })} ${renderComponent($$result4, "Button", $$Button, { "href": "/contact", "variant": "ghost", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`<i class="fa-solid fa-envelope mr-2" data-astro-cid-xglhyxzr></i> Anbefal en bog` })} </div> ` })} <div class="hidden md:block" data-astro-cid-xglhyxzr> ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Hvordan jeg bruger listen` })} <p class="text-[13px] text-dim mb-4 opacity-70 leading-relaxed" data-astro-cid-xglhyxzr>
Jeg opdaterer løbende. Nogle er “must-reads”, andre er bare bøger der ramte et tidspunkt i livet.
</p> <p class="text-[13px] text-dim opacity-70 leading-relaxed" data-astro-cid-xglhyxzr>
Tip: Tilføj gerne årstal og noter — det gør listen mere personlig.
</p> ` })} </div> </div> ` })} <!-- LISTE --> ${renderComponent($$result2, "Section", $$Section, { "id": "list", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "bordered", "class": "p-6", "data-astro-cid-xglhyxzr": true }, { "default": async ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, { "data-astro-cid-xglhyxzr": true }, { "default": async ($$result5) => renderTemplate`Favoritter` })} <p class="text-dim opacity-70 mb-6 text-sm" data-astro-cid-xglhyxzr>
Udskift titlerne med dine egne for at personliggøre listen.
</p> <div class="books-grid" data-astro-cid-xglhyxzr> ${booksData.map((book) => renderTemplate`${renderComponent($$result4, "BookCard", $$BookCard, { "title": book.data.title, "author": book.data.author, "year": book.data.year, "genre": book.data.genre, "tag": book.data.tag, "note": book.data.note, "links": book.data.links || [], "data-astro-cid-xglhyxzr": true })}`)} </div> ` })} ` })} <!-- CTA --> ${renderComponent($$result2, "Section", $$Section, { "data-astro-cid-xglhyxzr": true }, { "default": async ($$result3) => renderTemplate` ${renderComponent($$result3, "ContactCard", $$ContactCard, { "variant": "glass", "title": "Anbefal mig en bog", "text": "Send gerne en mail hvis du har forslag til sp\xE6ndende l\xE6sning.", "action": "email", "data-astro-cid-xglhyxzr": true })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/books.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/books.astro";
const $$url = "/books";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Books,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
