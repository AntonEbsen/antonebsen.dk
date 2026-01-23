import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, b as $$Button, $ as $$Card } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$Pill } from '../chunks/Pill_BHOYW9nv.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$FeatureCard, a as $$TechStack } from '../chunks/TechStack_v4Y_J-V0.mjs';
import { $ as $$Image } from '../chunks/_astro_assets_rKQn35vB.mjs';
import { m as myImage } from '../chunks/billede-af-mig_CQY-lzFg.mjs';
import { s as skillsData } from '../chunks/skills_DAl2nbEH.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 \xD8konomistuderende & Analytiker", "description": "Velkommen til Anton Meier Ebsen J\xF8rgensens personlige hjemmeside. Her finder du mit CV, portef\xF8lje og blog om \xF8konomi og data." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-12"> <!-- HERO SECTION --> ${renderComponent($$result2, "Section", $$Section, { "class": "grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20" }, { "default": ($$result3) => renderTemplate` <div class="space-y-6"> <div class="inline-block px-3 py-1 rounded-full bg-accent-soft text-accent text-xs font-bold uppercase tracking-wider">
Økonomistuderende @ KU
</div> <h1 class="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
Anton Meier <span class="text-accent underline decoration-4 underline-offset-8">Ebsen</span> Jørgensen
</h1> <p class="text-xl text-dim leading-relaxed max-w-lg">
Jeg kombinerer økonomisk teori med stærke kvantitative metoder og programmering for at skabe indsigt i komplekse problemstillinger.
</p> <div class="flex flex-wrap gap-4 pt-4"> ${renderComponent($$result3, "Button", $$Button, { "href": "/portfolio", "size": "lg" }, { "default": ($$result4) => renderTemplate`Se projekter` })} ${renderComponent($$result3, "Button", $$Button, { "href": "/cv", "variant": "ghost", "size": "lg" }, { "default": ($$result4) => renderTemplate`Mit CV` })} </div> </div> <div class="relative group"> <div class="absolute -inset-4 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-3xl blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div> <div class="relative aspect-square overflow-hidden rounded-2xl border border-glass-border shadow-2xl"> ${renderComponent($$result3, "Image", $$Image, { "src": myImage, "alt": "Anton Meier Ebsen J\xF8rgensen", "class": "object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700", "loading": "eager" })} </div> </div> ` })} <!-- QUICK STATS / CARDS --> ${renderComponent($$result2, "Section", $$Section, { "class": "grid grid-cols-1 md:grid-cols-3 gap-6 mb-24" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8 hover-glow group" }, { "default": ($$result4) => renderTemplate` <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors"> <i class="fa-solid fa-code text-accent text-xl"></i> </div> <h3 class="text-xl font-bold mb-3">Model & Data</h3> <p class="text-dim text-sm leading-relaxed">
Erfaring med Python, SAS og GAMS til økonomiske modeller og statistisk analyse.
</p> ` })} ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8 hover-glow group" }, { "default": ($$result4) => renderTemplate` <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors"> <i class="fa-solid fa-graduation-cap text-blue-400 text-xl"></i> </div> <h3 class="text-xl font-bold mb-3">Akademisk Fokus</h3> <p class="text-dim text-sm leading-relaxed">
Fokus på makroøkonomi, pengepolitik og økonometri på kandidaten ved KU.
</p> ` })} ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-8 hover-glow group" }, { "default": ($$result4) => renderTemplate` <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors"> <i class="fa-solid fa-chalkboard-user text-purple-400 text-xl"></i> </div> <h3 class="text-xl font-bold mb-3">Undervisning</h3> <p class="text-dim text-sm leading-relaxed">
Jeg formidler komplekse emner i Excel og VBA gennem struktureret undervisning.
</p> ` })} ` })} <!-- FEATURED PROJECT --> ${renderComponent($$result2, "Section", $$Section, { "class": "mb-24" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "FeatureCard", $$FeatureCard, { "badge": "Udvalgt Analyse", "title": "Global Financial Cycle & Spillovers", "description": "En \xF8konometrisk analyse af spillover-effekter fra amerikansk pengepolitik.", "tagString": "Makro\xF8konomi \xB7 SVAR \xB7 Python", "url": "/portfolio" })} ` })} <!-- SKILLS PREVIEW --> ${renderComponent($$result2, "Section", $$Section, { "class": "mb-24" }, { "default": ($$result3) => renderTemplate` <div class="text-center max-w-4xl mx-auto mb-16"> ${renderComponent($$result3, "SectionHeading", $$SectionHeading, { "class": "text-3xl font-bold mb-8" }, { "default": ($$result4) => renderTemplate`Værktøjskassen` })} <!-- Visual Tech Stack --> ${renderComponent($$result3, "TechStack", $$TechStack, { "skills": skillsData.programming })} <!-- Professional Areas (Secondary) --> <div class="flex flex-wrap justify-center gap-2 mt-8 opacity-90"> ${skillsData.professional.map((skill) => renderTemplate`${renderComponent($$result3, "Pill", $$Pill, { "variant": "default", "class": "text-sm" }, { "default": ($$result4) => renderTemplate`${skill.name}` })}`)} </div> </div> ` })} <!-- CTA --> ${renderComponent($$result2, "Section", $$Section, { "class": "text-center py-20 bg-accent/5 rounded-3xl border border-accent/10" }, { "default": ($$result3) => renderTemplate` <h2 class="text-3xl font-bold mb-6">Skal vi tage en snak?</h2> <p class="text-xl text-dim mb-10 max-w-xl mx-auto">
Jeg er altid interesseret i faglige diskussioner omkring økonomi, data og mulige samarbejder.
</p> ${renderComponent($$result3, "Button", $$Button, { "href": "/contact", "size": "lg" }, { "default": ($$result4) => renderTemplate`Kontakt mig her` })} ` })} </main> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/index.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
