import { b as createAstro, c as createComponent, m as maybeRenderHead, d as addAttribute, w as spreadAttributes, z as renderSlot, a as renderTemplate } from './astro/server_B2tU-5nP.mjs';
/* empty css                        */
import 'clsx';
/* empty css                        */

const $$Astro$2 = createAstro("https://antonebsen.dk");
const $$Section = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Section;
  const { class: className, id, ...rest } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section${addAttribute(id, "id")}${addAttribute(["mb-14", className], "class:list")}${spreadAttributes(rest)} data-astro-cid-5v3l7meg> ${renderSlot($$result, $$slots["default"])} </section> `;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/Section.astro", void 0);

const $$Astro$1 = createAstro("https://antonebsen.dk");
const $$Card = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Card;
  const { variant = "default", class: className, ...rest } = Astro2.props;
  const variants = {
    default: "bg-[var(--card)]",
    glass: "bg-[var(--glass)] backdrop-blur-md border border-[var(--glass-border)]",
    gradient: "bg-[var(--depth-bg)]",
    bordered: "border border-[var(--glass-border)] bg-[rgba(17,24,39,0.02)]"
  };
  const baseStyles = "rounded-[var(--radius)] p-6 shadow-[var(--shadow)] transition-transform duration-300 ease-out hover:-translate-y-1 hover:border-[var(--accent-soft)]";
  return renderTemplate`${maybeRenderHead()}<div${addAttribute([baseStyles, variants[variant], className], "class:list")}${spreadAttributes(rest)} data-astro-cid-dd5txfcy> ${renderSlot($$result, $$slots["default"])} </div> `;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/Card.astro", void 0);

const $$Astro = createAstro("https://antonebsen.dk");
const $$Button = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Button;
  const { href, variant = "primary", class: className, target, rel, download, ...rest } = Astro2.props;
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-[14.5px] transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) no-underline cursor-pointer";
  const variants = {
    primary: "bg-[var(--accent)] text-[#050506] hover:-translate-y-0.5 hover:shadow-[var(--glow)] hover:opacity-90",
    ghost: "bg-transparent border border-[var(--glass-border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:-translate-y-0.5"
  };
  return renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute([baseStyles, variants[variant], className], "class:list")}${addAttribute(target, "target")}${addAttribute(rel, "rel")}${addAttribute(download, "download")}${spreadAttributes(rest)}> ${renderSlot($$result, $$slots["default"])} </a>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/ui/Button.astro", void 0);

export { $$Card as $, $$Section as a, $$Button as b };
