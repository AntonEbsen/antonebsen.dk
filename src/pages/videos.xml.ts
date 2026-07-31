import rss from '@astrojs/rss';
import { CHANNEL_NAME } from '@lib/youtube';
import { getVideosNewestFirst, toFeedItems, withUtf8Charset } from '@lib/video-feed';
import type { APIContext } from 'astro';

export const prerender = true;

/**
 * English feed of curated videos from The Wandering Economist.
 * Points at the site's own detail pages, so subscribers land on the version with
 * the trail data and cross-links. Danish twin lives in videoer.xml.ts.
 */
export async function GET(context: APIContext) {
    const videos = await getVideosNewestFirst();

    return withUtf8Charset(await rss({
        title: `${CHANNEL_NAME} — Videos`,
        description: 'Hiking films from the mountains of Europe and economics explained through data.',
        site: context.site ?? 'https://antonebsen.dk',
        items: toFeedItems(videos, 'en'),
        customData: '<language>en</language>'
    }));
}
