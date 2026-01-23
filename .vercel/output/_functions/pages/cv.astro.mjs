import { c as createComponent, m as maybeRenderHead, r as renderComponent, d as addAttribute, a as renderTemplate, e as renderScript, b as createAstro } from '../chunks/astro/server_B2tU-5nP.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DcRku5aZ.mjs';
import { a as $$Section, $ as $$Card, b as $$Button } from '../chunks/Button_DQcS6BLE.mjs';
import { $ as $$SectionHeading } from '../chunks/SectionHeading_DJyXuGHt.mjs';
import { $ as $$Image } from '../chunks/_astro_assets_rKQn35vB.mjs';
import { s as skillsData } from '../chunks/skills_DAl2nbEH.mjs';
import { m as myImage } from '../chunks/billede-af-mig_CQY-lzFg.mjs';
import 'clsx';
import { c as cv } from '../chunks/cv_Bdw7tsR6.mjs';
/* empty css                              */
export { renderers } from '../renderers.mjs';

const dkFlag = new Proxy({"src":"/_astro/dansk-flag.CYyzt_OD.png","width":584,"height":443,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/dansk-flag.png";
							}
							
							return target[name];
						}
					});

const ukFlag = new Proxy({"src":"/_astro/britisk-flag.Bzgu5o_w.png","width":2560,"height":1280,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/britisk-flag.png";
							}
							
							return target[name];
						}
					});

const deFlag = new Proxy({"src":"/_astro/tysk-flag.2eO7-yS6.png","width":800,"height":480,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/tysk-flag.png";
							}
							
							return target[name];
						}
					});

const $$Sidebar = createComponent(($$result, $$props, $$slots) => {
  const flagMap = {
    "/assets/img/dansk-flag.png": dkFlag,
    "/assets/img/britisk-flag.png": ukFlag,
    "/assets/img/tysk-flag.png": deFlag
  };
  return renderTemplate`${maybeRenderHead()}<aside class="cv-side"> <div class="card profile-card"> ${renderComponent($$result, "Image", $$Image, { "src": myImage, "alt": "Anton Meier Ebsen J\xF8rgensen", "class": "profile-img" })} <div class="profile-head"> <h1>Anton Meier Ebsen Jørgensen</h1> <p class="subtitle">Økonomistuderende (cand.polit.) · Makroøkonomi · Økonometri · Økonomiske modeller</p> </div> <div class="meta"> <div class="meta-row"> <span class="meta-label">Lokation</span> <span class="meta-value"> <a href="https://www.google.com/maps/search/?api=1&query=K%C3%B8benhavn" target="_blank" rel="noopener">København</a> </span> </div> <div class="meta-row"> <span class="meta-label">Email</span> <span class="meta-value"><a href="mailto:anton.ebsen@gmail.com">anton.ebsen@gmail.com</a></span> </div> <div class="meta-row"> <span class="meta-label">Telefon</span> <span class="meta-value"><a href="tel:+4525740131">+45 25 74 01 31</a></span> </div> <div class="meta-row"> <span class="meta-label">Profiler</span> <span class="meta-value icon-links" aria-label="Profiler"> <a class="icon-link" href="https://www.linkedin.com/in/antonebsen/" target="_blank" rel="noopener" aria-label="LinkedIn"> <i class="fa-brands fa-linkedin" aria-hidden="true"></i> </a> <a class="icon-link" href="https://github.com/AntonEbsen" target="_blank" rel="noopener" aria-label="GitHub"> <i class="fa-brands fa-github" aria-hidden="true"></i> </a> </span> </div> </div> <div class="cta-row"> <a class="btn" href="/assets/Anton-CV.pdf" target="_blank" rel="noopener"> <i class="fa-solid fa-download" aria-hidden="true"></i> Download CV (PDF)
</a> </div> </div> <div class="card" id="skills"> <h2>Kompetencer</h2> <h3>Faglige kompetencer</h3> <div class="focus-grid" aria-label="Faglige kompetencer"> ${skillsData.professional.map((skill) => renderTemplate`<a class="focus-box"${addAttribute(`/skills#${skill.id}`, "href")}${addAttribute(skill.title, "title")}> <i${addAttribute(skill.icon, "class")} aria-hidden="true"></i> <span>${skill.name}</span> </a>`)} </div> <hr class="divider"> <h3>Programmeringssprog</h3> <div class="skills-grid" aria-label="Programmeringssprog"> ${skillsData.programming.map((skill) => renderTemplate`<a class="skill-box"${addAttribute(`/skills#${skill.id}`, "href")}${addAttribute(skill.title, "title")}> <i${addAttribute(skill.icon, "class")} aria-hidden="true"></i> <span>${skill.name}</span> </a>`)} </div> <hr class="divider"> <h3>Fokusområder</h3> <div class="focus-grid" aria-label="Fokusområder"> ${skillsData.focus.map((skill) => renderTemplate`<div class="focus-box"> <i${addAttribute(skill.icon, "class")} aria-hidden="true"></i> <span>${skill.name}</span> </div>`)} </div> <hr class="divider"> <div class="lang-grid" aria-label="Sprog"> ${skillsData.languages.map((lang) => renderTemplate`<div class="lang-box"> ${flagMap[lang.flag] && renderTemplate`${renderComponent($$result, "Image", $$Image, { "src": flagMap[lang.flag], "alt": lang.name, "class": "lang-flag-sm" })}`} <div class="lang-text"> <div class="lang-name">${lang.name}</div> <div class="lang-level">${lang.level}</div> </div> </div>`)} </div> </div> </aside>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/cv/Sidebar.astro", void 0);

const $$TableOfContents = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<aside class="toc" id="toc" aria-label="Indholdsfortegnelse"> <div class="toc-header"> <button id="tocToggle" class="toc-toggle" type="button" aria-expanded="true" aria-controls="tocNav" aria-label="Vis/skjul indholdsfortegnelse" title="Vis/skjul indholdsfortegnelse"> <span class="hamburger" aria-hidden="true"></span> </button> </div> <nav id="tocNav" class="toc-nav"> <a href="#profile">Profil</a> <a href="#experience">Erhvervserfaring</a> <a href="#education">Uddannelse</a> <a href="#projects">Projekter</a> <a href="#skills">Kompetencer</a> <a href="#languages">Sprog</a> <a href="#volunteer">Frivilligt</a> <a href="#certifications">Certificeringer</a> <a href="#contact">Kontakt</a> </nav> </aside> ${renderScript($$result, "C:/Users/Anton/antonebsen.dk/src/components/cv/TableOfContents.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/Anton/antonebsen.dk/src/components/cv/TableOfContents.astro", void 0);

const matlabCert = new Proxy({"src":"/_astro/matlab-onramp._xYWbv2e.PNG","width":965,"height":682,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/matlab-onramp.PNG";
							}
							
							return target[name];
						}
					});

const vectorCert = new Proxy({"src":"/_astro/calculations-with-vectors-and-matrices.D5B2few7.PNG","width":964,"height":680,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "C:/Users/Anton/antonebsen.dk/src/assets/img/calculations-with-vectors-and-matrices.PNG";
							}
							
							return target[name];
						}
					});

const $$Astro = createAstro("https://antonebsen.dk");
const $$CertificationList = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CertificationList;
  const certImageMap = {
    "/assets/img/matlab-onramp.PNG": matlabCert,
    "/assets/img/calculations-with-vectors-and-matrices.PNG": vectorCert
  };
  const certifications = cv.certifications || [];
  return renderTemplate`${maybeRenderHead()}<div class="cert-grid"> ${certifications.map((cert) => renderTemplate`<div class="cert"> <a${addAttribute(cert.url, "href")} target="_blank" rel="noopener"> ${certImageMap[cert.image] && renderTemplate`${renderComponent($$result, "Image", $$Image, { "src": certImageMap[cert.image], "alt": `${cert.name} certifikat`, "class": "cert-img" })}`} </a> <h3 class="text-sm font-bold mt-2 mb-1"> <a${addAttribute(cert.url, "href")} target="_blank" rel="noopener" class="no-underline text-white hover:text-accent"> ${cert.displayName || cert.name} </a> </h3> <p class="text-xs text-dim">${cert.description}</p> </div>`)} </div>`;
}, "C:/Users/Anton/antonebsen.dk/src/components/cv/CertificationList.astro", void 0);

const $$Cv = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Anton Meier Ebsen J\xF8rgensen \u2013 CV", "description": "CV: Anton Meier Ebsen J\xF8rgensen \u2013 \xF8konomistuderende med fokus p\xE5 makro\xF8konomi, \xF8konometri og \xF8konomiske modeller.", "bodyClass": "cv-page" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="cv-wrap"> <!-- TOC --> ${renderComponent($$result2, "TableOfContents", $$TableOfContents, {})} <!-- CV grid --> <section class="cv-grid" aria-label="CV indhold"> <!-- Sidebar --> ${renderComponent($$result2, "Sidebar", $$Sidebar, {})} <div class="cv-main"> ${renderComponent($$result2, "Section", $$Section, { "id": "profile" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Profil` })} <p class="mb-4 text-[15px] leading-relaxed opacity-90">
Engageret økonomistuderende på kandidatuddannelsen ved Københavns Universitet med særligt fokus på
              makroøkonomi, økonometri og økonomiske modeller. Jeg har erfaring med programmering og databehandling
              gennem kurser i Python, tidsrækkemodeller (SAS) og CGE-modeller, samt undervisning i Excel og VBA.
</p> <p class="text-[15px] leading-relaxed opacity-90">
Jeg trives med at arbejde med tal og komplekse datasæt og med at omsætte analyser til resultater, der kan
              bruges som solidt grundlag for beslutninger.
</p> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "experience" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Erhvervserfaring` })} <div class="space-y-0"> ${cv.experience.map((item) => renderTemplate`<article class="item"> <div class="item-head"> <h3 class="text-[18px] font-bold m-0 mb-1">${item.title} · ${item.organization}</h3> <span class="text-[13px] text-dim">${item.location} · ${item.period}</span> </div> <ul class="list-none p-0 m-0 mt-3 space-y-1"> ${item.description.map((bullet) => renderTemplate`<li class="relative pl-3 before:content-['•'] before:absolute before:left-0 before:text-accent text-[14px] opacity-90">${bullet}</li>`)} </ul> </article>`)} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "education" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Uddannelse` })} <div class="space-y-0"> ${cv.education.map((item) => renderTemplate`<article class="item"> <div class="item-head"> <h3 class="text-[18px] font-bold m-0 mb-1">${item.degree} · ${item.institution}</h3> <span class="text-[13px] text-dim">${item.location} · ${item.period}</span> </div> ${item.description && renderTemplate`<p class="text-[14px] text-dim mt-2 opacity-80">${item.description}</p>`} </article>`)} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "projects" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Projekter` })} <div class="space-y-0"> ${cv.projects.map((project) => renderTemplate`<article class="item"> <div class="item-head"> <h3 class="text-[18px] font-bold m-0 mb-1">${project.title}</h3> ${project.meta && renderTemplate`<span class="text-[13px] text-dim">${project.meta}</span>`} </div> <p class="text-[14px] text-dim mt-2 opacity-80"> ${project.description} </p> </article>`)} </div> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "volunteer" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Frivilligt` })} <article class="item border-none pt-0"> <div class="item-head"> <h3 class="text-[18px] font-bold m-0 mb-1">Forperson · Socialøkonomisk Samfund</h3> <span class="text-[13px] text-dim">København K · 2024 – nu</span> </div> <p class="text-[14px] text-dim mt-2 opacity-80">Planlægning/koordinering af aktiviteter og arrangementer.</p> </article> ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "certifications" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Certificeringer` })} ${renderComponent($$result4, "CertificationList", $$CertificationList, {})} ` })} ` })} ${renderComponent($$result2, "Section", $$Section, { "id": "contact" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Card", $$Card, { "variant": "glass", "class": "p-6" }, { "default": ($$result4) => renderTemplate` ${renderComponent($$result4, "SectionHeading", $$SectionHeading, {}, { "default": ($$result5) => renderTemplate`Kontakt` })} <div class="contact-row"> ${renderComponent($$result4, "Button", $$Button, { "href": "mailto:anton.ebsen@gmail.com", "variant": "ghost" }, { "default": ($$result5) => renderTemplate` <i class="fa-solid fa-envelope mr-2" aria-hidden="true"></i>
anton.ebsen@gmail.com
` })} ${renderComponent($$result4, "Button", $$Button, { "href": "https://www.linkedin.com/in/antonebsen/", "target": "_blank", "rel": "noopener", "aria-label": "LinkedIn", "variant": "ghost" }, { "default": ($$result5) => renderTemplate` <i class="fa-brands fa-linkedin" aria-hidden="true"></i> ` })} ${renderComponent($$result4, "Button", $$Button, { "href": "https://github.com/AntonEbsen", "target": "_blank", "rel": "noopener", "aria-label": "GitHub", "variant": "ghost" }, { "default": ($$result5) => renderTemplate` <i class="fa-brands fa-github" aria-hidden="true"></i> ` })} </div> ` })} ` })} </div> </section> </div> ` })}`;
}, "C:/Users/Anton/antonebsen.dk/src/pages/cv.astro", void 0);

const $$file = "C:/Users/Anton/antonebsen.dk/src/pages/cv.astro";
const $$url = "/cv";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Cv,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
