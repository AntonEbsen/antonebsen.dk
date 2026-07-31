import { getVideosNewestFirst, videoPath } from '@lib/video-feed';
import type { APIContext } from 'astro';

export const prerender = true;

const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

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

    const entries = videos
        .flatMap((video) =>
            (['da', 'en'] as const).map((lang) => {
                const isDa = lang === 'da';
                const title = (isDa && video.title_da) || video.title;
                const description = (isDa && video.description_da) || video.description;

                return `  <url>
    <loc>${site}${videoPath(video.slug, lang)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnail ?? `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`)}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(description)}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube-nocookie.com/embed/${video.youtubeId}`)}</video:player_loc>
      <video:publication_date>${new Date(video.publishedAt).toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
  </url>`;
            })
        )
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>
`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
