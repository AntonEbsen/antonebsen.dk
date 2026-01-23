import { b as createAstro, c as createComponent, m as maybeRenderHead, d as addAttribute, z as renderSlot, a as renderTemplate } from './astro/server_B2tU-5nP.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://antonebsen.dk");
const $$SectionHeading = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SectionHeading;
  const { class: className = "" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<h2${addAttribute(["text-xs font-bold uppercase tracking-wider text-accent mb-4", className], "class:list")}> ${renderSlot($$result, $$slots["default"])} </h2>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/SectionHeading.astro", void 0);

export { $$SectionHeading as $ };
