import {
    getVideosNewestFirst, groupBySeries, videoPath, seriesPath,
    videoTitle, videoDescription, thumbnailUrl,
    type FeedVideoEntry, type Lang
} from '@lib/video-feed';
import type { APIContext } from 'astro';

export const prerender = true;

const LANGS: Lang[] = ['da', 'en', 'de'];

const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

/** One <video:video> block. A <url> may hold several — a series page does. */
function videoBlock(video: FeedVideoEntry, lang: Lang) {
    return `    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnailUrl(video))}</video:thumbnail_loc>
      <video:title>${escapeXml(videoTitle(video, lang))}</video:title>
      <video:description>${escapeXml(videoDescription(video, lang))}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube-nocookie.com/embed/${video.youtubeId}`)}</video:player_loc>
      <video:publication_date>${new Date(video.publishedAt).toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>`;
}

/**
 * Google video sitemap.
 *
 * @astrojs/sitemap cannot emit the `video:video` extension, so this is hand-rolled
 * alongside the main sitemap-index. Registered in public/robots.txt.
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
 */
export async function GET(context: APIContext) {
    const site = (context.site ?? new URL('https://antonebsen.dk')).origin;
    const videos = await getVideosNewestFirst();

    const urls: string[] = [];

    // One <url> per video per language.
    for (const video of videos) {
        for (const lang of LANGS) {
            urls.push(`  <url>
    <loc>${site}${videoPath(video.slug, lang)}</loc>
${videoBlock(video, lang)}
  </url>`);
        }
    }

    // Series pages carry every episode they list.
    for (const group of groupBySeries(videos)) {
        for (const lang of LANGS) {
            urls.push(`  <url>
    <loc>${site}${seriesPath(group.slug, lang)}</loc>
${group.videos.map((video) => videoBlock(video, lang)).join('\n')}
  </url>`);
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
