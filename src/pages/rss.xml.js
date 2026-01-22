import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const posts = await getCollection('blog');

    return rss({
        title: 'Anton Meier Ebsen Jørgensen | Blog',
        description: 'Økonomi, makro, data og tanker om læring.',
        site: context.site,
        items: posts.map((post) => ({
            title: post.data.title,
            pubDate: post.data.meta ? new Date() : new Date(), // TODO: add real date field to schema
            description: post.data.description,
            // Since we don't have individual pages yet, link to blog overview anchors
            // ideally: link: `/blog/${post.slug}/`
            link: post.data.links?.[0]?.url || `/blog#${post.data.category}`,
        })),
        customData: `<language>da-dk</language>`,
    });
}
