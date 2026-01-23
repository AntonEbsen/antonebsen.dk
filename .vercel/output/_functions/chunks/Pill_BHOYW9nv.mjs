import { b as createAstro, c as createComponent, m as maybeRenderHead, d as addAttribute, z as renderSlot, a as renderTemplate } from './astro/server_B2tU-5nP.mjs';
import 'piccolore';
import 'clsx';

const $$Astro = createAstro("https://antonebsen.dk");
const $$Pill = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pill;
  const { variant = "default", class: className } = Astro2.props;
  const baseStyles = "px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border";
  const variants = {
    default: "bg-[var(--glass)] border-[var(--glass-border)] text-[var(--text-dim)]",
    accent: "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
  };
  return renderTemplate`${maybeRenderHead()}<span${addAttribute([baseStyles, variants[variant], className], "class:list")}> ${renderSlot($$result, $$slots["default"])} </span>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/Pill.astro", void 0);

export { $$Pill as $ };
