import { n as navigation } from '../chunks/ui_D20BAPtt.mjs';
import { p as portfolioData, b as blogData } from '../chunks/blog_C5GzFnLC.mjs';
import { s as skillsData } from '../chunks/skills_DAl2nbEH.mjs';
export { renderers } from '../renderers.mjs';

async function GET(context) {
  const searchIndex = [];
  const addedUrls = /* @__PURE__ */ new Set();
  const addItem = (item) => {
    const key = item.url + "|" + item.lang;
    if (addedUrls.has(key)) return;
    searchIndex.push(item);
    addedUrls.add(key);
  };
  navigation.da.forEach((nav) => {
    addItem({
      title: nav.label,
      url: nav.url,
      content: `Gå til ${nav.label} siden.`,
      tags: ["page"],
      lang: "da"
    });
    if (nav.children) {
      nav.children.forEach((child) => {
        addItem({
          title: child.label,
          url: child.url,
          content: child.label,
          tags: ["page", "subpage"],
          lang: "da"
        });
      });
    }
  });
  navigation.en.forEach((nav) => {
    addItem({
      title: nav.label,
      url: nav.url,
      content: `Go to ${nav.label} page.`,
      tags: ["page", "en"],
      lang: "en"
    });
    if (nav.children) {
      nav.children.forEach((child) => {
        addItem({
          title: child.label,
          url: child.url,
          content: child.label,
          tags: ["page", "subpage", "en"],
          lang: "en"
        });
      });
    }
  });
  portfolioData.forEach((item) => {
    addItem({
      title: item.title,
      url: "/portfolio",
      content: item.description + " " + item.tools,
      tags: ["portfolio", "project", item.tagString],
      lang: "da"
    });
  });
  Object.values(blogData).flat().forEach((post) => {
    const url = post.links?.[0]?.url || "#";
    if (url === "#" || url.startsWith("#")) return;
    addItem({
      title: post.title,
      url,
      content: post.description || "",
      tags: ["blog", post.tag || ""],
      lang: "da"
    });
  });
  skillsData.programming.forEach((skill) => {
    addItem({
      title: skill.name,
      url: "/cv#skills",
      content: `Erfaring med ${skill.name}. ${skill.title || ""}`,
      tags: ["skill", "tool"],
      lang: "da"
    });
  });
  return new Response(JSON.stringify(searchIndex), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
