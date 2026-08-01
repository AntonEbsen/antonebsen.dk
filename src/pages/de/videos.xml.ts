import rss from '@astrojs/rss';
import { CHANNEL_NAME } from '@lib/youtube';
import { getVideosNewestFirst, toFeedItems, withUtf8Charset, MEDIA_RSS_XMLNS } from '@lib/video-feed';
import type { APIContext } from 'astro';

export const prerender = true;

/** German feed — twins in videos.xml.ts (en) and videoer.xml.ts (da). */
export async function GET(context: APIContext) {
    const videos = await getVideosNewestFirst();

    return withUtf8Charset(await rss({
        title: `${CHANNEL_NAME} — Videos`,
        description: 'Wanderfilme aus den Bergen Europas und Wirtschaft anhand von Daten erklärt.',
        site: context.site ?? 'https://antonebsen.dk',
        items: toFeedItems(videos, 'de'),
        xmlns: MEDIA_RSS_XMLNS,
        customData: '<language>de</language>'
    }));
}
