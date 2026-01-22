import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
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
