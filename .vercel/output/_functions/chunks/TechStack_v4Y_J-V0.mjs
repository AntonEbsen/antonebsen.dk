import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as addAttribute } from './astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Card, b as $$Button } from './Button_DQcS6BLE.mjs';
import 'clsx';

const $$Astro$1 = createAstro("https://antonebsen.dk");
const $$FeatureCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$FeatureCard;
  const { title, tagString, description, url = "#", badge = "Featured Analysis" } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Card", $$Card, { "variant": "glass", "class": "p-8 md:p-10 relative overflow-hidden group" }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-accent/10 transition duration-700"></div> <div class="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between"> <div class="space-y-4 max-w-2xl"> <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold uppercase tracking-wider text-accent"> <i class="fa-solid fa-star text-[10px]"></i> ${badge} </div> <h2 class="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-2"> ${title} </h2> <p class="text-lg text-dim leading-relaxed"> ${description} </p> ${tagString && renderTemplate`<div class="text-sm font-mono text-accent/80 pt-1"> <i class="fa-solid fa-tags mr-2 opacity-50"></i>${tagString} </div>`} </div> <div class="md:shrink-0 pt-4 md:pt-0"> ${renderComponent($$result2, "Button", $$Button, { "href": url, "size": "lg", "icon": "arrow-right" }, { "default": ($$result3) => renderTemplate`Read Analysis` })} </div> </div> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/FeatureCard.astro", void 0);

const $$Astro = createAstro("https://antonebsen.dk");
const $$TechStack = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$TechStack;
  const { skills } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4"> ${skills.map((skill) => renderTemplate`<div class="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-glass border border-glass-border hover:border-accent/40 hover:bg-accent/5 transition-all duration-300"> <!-- Glow Effect --> <div class="absolute inset-0 bg-accent/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div> <!-- Icon --> <div class="relative z-10 text-3xl text-dim group-hover:text-accent transition-colors duration-300 mb-3"> <i${addAttribute(skill.icon, "class")}></i> </div> <!-- Label --> <span class="relative z-10 text-xs font-semibold text-text/80 group-hover:text-white transition-colors duration-300 text-center"> ${skill.name} </span> </div>`)} </div>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/TechStack.astro", void 0);

export { $$FeatureCard as $, $$TechStack as a };
