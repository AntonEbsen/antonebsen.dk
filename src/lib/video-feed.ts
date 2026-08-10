import { getCollection } from 'astro:content';

export type Lang = 'da' | 'en' | 'de';

/** A video entry flattened with its slug, newest first. */
export async function getVideosNewestFirst() {
    const videos = await getCollection('videos');

    return videos
        .map((entry) => ({ slug: entry.id.replace(/\.json$/, ''), ...entry.data }))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export type FeedVideoEntry = Awaited<ReturnType<typeof getVideosNewestFirst>>[number];

// --- Routing ---------------------------------------------------------------

const VIDEOS_ROOT: Record<Lang, string> = {
    da: '/videoer',
    en: '/en/videos',
    de: '/de/videos'
};

const SERIES_SEGMENT: Record<Lang, string> = {
    da: 'serie',
    en: 'series',
    de: 'series'
};

/** Localised path to the video index. */
export const videosRoot = (lang: Lang) => VIDEOS_ROOT[lang];

/** Localised path to a video's detail page. */
export const videoPath = (slug: string, lang: Lang) => `${VIDEOS_ROOT[lang]}/${slug}`;

/** Localised path to a series page. */
export const seriesPath = (slug: string, lang: Lang) =>
    `${VIDEOS_ROOT[lang]}/${SERIES_SEGMENT[lang]}/${slug}`;

export const slugifySeries = (series: string) =>
    series
        .toLowerCase()
        .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// --- Localised copy --------------------------------------------------------

/**
 * The videos themselves are in English; only Danish has hand-written titles.
 * German falls back to English rather than inventing a translation — writing
 * those is an editorial decision, not the code's.
 */
export const videoTitle = (video: FeedVideoEntry, lang: Lang) =>
    (lang === 'da' && video.title_da) || (lang === 'de' && video.title_de) || video.title;

export const videoDescription = (video: FeedVideoEntry, lang: Lang) =>
    (lang === 'da' && video.description_da) || (lang === 'de' && video.description_de) || video.description;

export const videoSeriesName = (video: FeedVideoEntry, lang: Lang) =>
    (lang === 'da' && video.series_da) || (lang === 'de' && video.series_de) || video.series;

export const thumbnailUrl = (video: FeedVideoEntry) =>
    video.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`;

// --- Track identity -------------------------------------------------------

export type Track = 'hiking' | 'economics';

/**
 * The channel's two worlds get their own colour: moss for the trails, terracotta
 * for the economics. One place decides, so a pill, a filter button and a graph
 * node cannot drift apart.
 */
export const trackPillVariant = (track: Track): 'moss' | 'accent' =>
    track === 'hiking' ? 'moss' : 'accent';

/** CSS custom property holding this track's colour. */
export const trackColorVar = (track: Track) =>
    track === 'hiking' ? 'var(--accent-2)' : 'var(--accent)';

/**
 * Literal hex, for the places CSS variables cannot reach — three.js in the
 * Knowledge Web, Chart.js canvases, Satori OG images. Keep in step with
 * --accent-2 / --accent in BaseLayout.astro and variables.css.
 */
export const TRACK_HEX: Record<Track, string> = {
    hiking: '#6F9E7B',
    economics: '#D4794F'
};

export const trackIcon = (track: Track) =>
    track === 'hiking' ? 'fa-solid fa-mountain-sun' : 'fa-solid fa-chart-line';

// --- Series ----------------------------------------------------------------

export interface SeriesGroup {
    slug: string;
    /** Canonical (English) series name, as written in the JSON. */
    name: string;
    /** Episodes in narrative order. */
    videos: FeedVideoEntry[];
}

/** Groups videos by series, each ordered by seriesOrder then publish date. */
export function groupBySeries(videos: FeedVideoEntry[]): SeriesGroup[] {
    const groups = new Map<string, SeriesGroup>();

    for (const video of videos) {
        if (!video.series) continue;

        const slug = slugifySeries(video.series);
        const existing = groups.get(slug);

        if (existing) existing.videos.push(video);
        else groups.set(slug, { slug, name: video.series, videos: [video] });
    }

    for (const group of groups.values()) {
        group.videos.sort(
            (a, b) =>
                (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.seriesOrder ?? Number.MAX_SAFE_INTEGER) ||
                new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        );
    }

    return [...groups.values()];
}

/** The episode before and after `video` within its own series. */
export function seriesNeighbours(videos: FeedVideoEntry[], video: FeedVideoEntry) {
    if (!video.series) return { group: undefined, previous: undefined, next: undefined };

    const group = groupBySeries(videos).find((g) => g.slug === slugifySeries(video.series!));
    if (!group) return { group: undefined, previous: undefined, next: undefined };

    const index = group.videos.findIndex((v) => v.slug === video.slug);

    return {
        group,
        previous: index > 0 ? group.videos[index - 1] : undefined,
        next: index > -1 && index < group.videos.length - 1 ? group.videos[index + 1] : undefined
    };
}

// --- Feeds -----------------------------------------------------------------

/** Media RSS namespace, so feed readers can show a thumbnail for each video. */
export const MEDIA_RSS_XMLNS = { media: 'http://search.yahoo.com/mrss/' };

const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

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
export function toFeedItems(videos: FeedVideoEntry[], lang: Lang) {
    return videos.map((video) => ({
        title: videoTitle(video, lang),
        description: videoDescription(video, lang),
        pubDate: new Date(video.publishedAt),
        link: videoPath(video.slug, lang),
        categories: [video.track, video.series].filter((c): c is string => !!c),
        // <enclosure> would need a byte length we cannot know for a remote
        // thumbnail; Media RSS is what readers actually use for video anyway.
        customData: `<media:thumbnail url="${escapeXml(thumbnailUrl(video))}" />`
    }));
}
