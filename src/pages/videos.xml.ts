import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { CHANNEL_NAME } from '@lib/youtube';
import type { APIContext } from 'astro';

export const prerender = true;

/**
 * Feed of curated videos from The Wandering Economist.
 *
 * Points at the site's own detail pages rather than YouTube, so subscribers land
 * on the version with the trail data and cross-links.
 */
export async function GET(context: APIContext) {
    const videos = await getCollection('videos');

    const items = videos
        .map((entry) => ({ slug: entry.id.replace(/\.json$/, ''), ...entry.data }))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return rss({
        title: `${CHANNEL_NAME} — Videos`,
        description: 'Hiking films from the mountains of Europe and economics explained through data.',
        site: context.site ?? 'https://antonebsen.dk',
        items: items.map((video) => ({
            title: video.title,
            description: video.description,
            pubDate: new Date(video.publishedAt),
            link: `/en/videos/${video.slug}`,
            categories: [video.track, video.series].filter((c): c is string => !!c)
        })),
        customData: '<language>en</language>'
    });
}
