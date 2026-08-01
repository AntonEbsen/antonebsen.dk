import rss from '@astrojs/rss';
import { CHANNEL_NAME } from '@lib/youtube';
import { getVideosNewestFirst, toFeedItems, withUtf8Charset, MEDIA_RSS_XMLNS } from '@lib/video-feed';
import type { APIContext } from 'astro';

export const prerender = true;

/** Danish feed — English twin lives in videos.xml.ts. */
export async function GET(context: APIContext) {
    const videos = await getVideosNewestFirst();

    return withUtf8Charset(await rss({
        title: `${CHANNEL_NAME} — Videoer`,
        description: 'Vandrefilm fra Europas bjerge og økonomi forklaret gennem data.',
        site: context.site ?? 'https://antonebsen.dk',
        items: toFeedItems(videos, 'da'),
        xmlns: MEDIA_RSS_XMLNS,
        customData: '<language>da</language>'
    }));
}
