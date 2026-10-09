import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { publishedPosts, postUrl, postTitle, postDescription, SITE } from '@lib/blog';

export const prerender = true;

/**
 * The blog as a feed (en). The site had feeds for the videos and none for the
 * writing, which is the part people would actually subscribe to. Items point at
 * the post pages and carry the publication date the posts now have.
 */
export async function GET(context: APIContext) {
    const posts = await publishedPosts();
    const feed = await rss({
        title: 'Anton Meier Ebsen Jørgensen — Blog',
        description: 'Essays on macroeconomics, monetary policy and economic history.',
        site: context.site ?? SITE,
        items: posts.map((post) => ({
            title: postTitle(post, 'en'),
            description: postDescription(post, 'en'),
            pubDate: new Date(post.data.date),
            link: postUrl(post.id, 'en'),
            categories: [post.data.category, ...(post.data.series ? [post.data.series] : [])],
        })),
        customData: '<language>en</language>',
    });
    // The charset: without it some readers show the Danish letters as mojibake.
    return new Response(await feed.text(), {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
