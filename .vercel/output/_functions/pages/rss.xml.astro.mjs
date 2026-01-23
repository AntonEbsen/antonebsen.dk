import rss from '@astrojs/rss';
import { g as getCollection } from '../chunks/_astro_content_BKcjA1Dz.mjs';
export { renderers } from '../renderers.mjs';

async function GET(context) {
    const blog = await getCollection('blog');
    return rss({
        title: 'Anton Meier Ebsen Jørgensen – Blog',
        description: 'Blog med indlæg om faglige emner (økonomi, data, modeller), træning og rejser.',
        site: context.site,
        items: blog.map((post) => ({
            title: post.data.title,
            pubDate: new Date(), // Replace with actual date if available
            description: post.data.description,
            link: `/blog/${post.id}/`,
        })),
        customData: `<language>da-dk</language>`,
    });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
