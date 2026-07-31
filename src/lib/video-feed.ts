import { getCollection } from 'astro:content';

/** A video entry flattened with its slug, newest first. */
export async function getVideosNewestFirst() {
    const videos = await getCollection('videos');

    return videos
        .map((entry) => ({ slug: entry.id.replace(/\.json$/, ''), ...entry.data }))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export type FeedVideoEntry = Awaited<ReturnType<typeof getVideosNewestFirst>>[number];

/** Localised path to a video's detail page. */
export const videoPath = (slug: string, lang: 'da' | 'en') =>
    `${lang === 'da' ? '/videoer' : '/en/videos'}/${slug}`;

/** Localised path to a series page. */
export const seriesPath = (slug: string, lang: 'da' | 'en') =>
    `${lang === 'da' ? '/videoer/serie' : '/en/videos/series'}/${slug}`;

export const slugifySeries = (series: string) =>
    series
        .toLowerCase()
        .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/**
 * @astrojs/rss serves `application/xml` with no charset. Conformant parsers fall
 * back to the XML declaration (RFC 7303), but lenient clients guess Latin-1 and
 * mangle "ø" and "—". Restating the charset costs nothing.
 */
export async function withUtf8Charset(response: Response): Promise<Response> {
    // Must go through Headers, not a plain object: spreading produces a lowercase
    // `content-type` key that a differently-cased literal will not overwrite, and
    // the two then get joined into "application/xml, application/xml; charset=utf-8".
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/xml; charset=utf-8');

    return new Response(await response.text(), { status: response.status, headers });
}

/** Builds the per-language item list shared by the RSS feeds. */
export function toFeedItems(videos: FeedVideoEntry[], lang: 'da' | 'en') {
    const isDa = lang === 'da';

    return videos.map((video) => ({
        title: (isDa && video.title_da) || video.title,
        description: (isDa && video.description_da) || video.description,
        pubDate: new Date(video.publishedAt),
        link: videoPath(video.slug, lang),
        categories: [video.track, video.series].filter((c): c is string => !!c)
    }));
}
