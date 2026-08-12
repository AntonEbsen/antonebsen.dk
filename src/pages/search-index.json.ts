import { getCollection } from 'astro:content';
import {
    getVideosNewestFirst, videoPath, seriesPath, groupBySeries,
    videoTitle, videoDescription, videoSeriesName
} from '@lib/video-feed';
import { resolveTranscript } from '@lib/video-transcript';

// Which projects actually have an English page, derived from the filesystem so it
// cannot drift as pages are added.
const enProjectSlugs = new Set(
    Object.keys(import.meta.glob('./en/projects/*.astro'))
        .map(path => path.split('/').pop()!.replace(/\.astro$/, ''))
);

// Astro 5 does not put `slug` on `type: 'data'` collections — every entry here has
// `id` only. The index used to read `.slug` throughout, so it emitted `/undefined`
// for every blog post, page and project. Everything below uses `id`.
export async function GET() {
    const posts = await getCollection('blog');
    const cvEntries = await getCollection('cv');
    const pages = await getCollection('pages');
    const videos = await getVideosNewestFirst();

    const index = [];

    // 1. Admin / Static Commands
    const commands = [
        { title: "Dashboard", url: "/dashboard", type: "command", icon: "fa-solid fa-gauge", tags: ["admin"], lang: "en" },
        { title: "Research Lab", url: "/research", type: "page", icon: "fa-solid fa-flask-vial", tags: ["academic", "phd", "research"], lang: "en" },
        { title: "Cliometrics", url: "/en/cliometrics", type: "page", icon: "fa-solid fa-chart-line", tags: ["economic history", "cliometrics", "data"], lang: "en" },
        { title: "Research Lab", url: "/research", type: "page", icon: "fa-solid fa-flask-vial", tags: ["akademisk", "phd", "forskning"], lang: "da" },
        { title: "Cliometrics", url: "/cliometrics", type: "page", icon: "fa-solid fa-chart-line", tags: ["økonomisk historie", "cliometri", "data"], lang: "da" },
        { title: "Backup Data", url: "/api/backup", type: "command", icon: "fa-solid fa-download", tags: ["admin"], lang: "en" },
        { title: "Trophy Room", url: "#trophy-room", type: "command", icon: "fa-solid fa-trophy", tags: ["game"], lang: "en" },
        { title: "Trophäenraum", url: "#trophy-room", type: "command", icon: "fa-solid fa-trophy", tags: ["game"], lang: "de" },
        { title: "Trophy Room", url: "#trophy-room", type: "command", icon: "fa-solid fa-trophy", tags: ["spil"], lang: "da" },
        { title: "CV", url: "/cv", type: "page", icon: "fa-solid fa-file-pdf", tags: ["resume"], lang: "en" },
        { title: "CV", url: "/da/cv", type: "page", icon: "fa-solid fa-file-pdf", tags: ["cv"], lang: "da" },
        { title: "Lebenslauf", url: "/de/cv", type: "page", icon: "fa-solid fa-file-pdf", tags: ["lebenslauf"], lang: "de" }
    ];
    index.push(...commands);

    // 2. Blog Posts (Multi-language)
    // Danish is served from /blog/<id> and English from /en/blog/<id>, matching the
    // rest of the site. This loop had the two the other way round and pointed Danish
    // at /da/blog/<id>, a route that does not exist — so every Danish blog hit 404'd
    // and every English one served Danish.
    for (const post of posts) {
        // Danish (site root)
        index.push({
            title: post.data.title_da || post.data.title,
            url: `/blog/${post.id}`,
            content: Array.isArray(post.data.content_da)
                ? post.data.content_da.join(' ')
                : (post.data.description_da || post.data.description),
            tags: [post.data.tag, ...(post.data.tags || [])],
            type: 'blog',
            icon: 'fa-solid fa-newspaper',
            lang: 'da'
        });

        // English
        index.push({
            title: post.data.title,
            url: `/en/blog/${post.id}`,
            content: Array.isArray(post.data.content) ? post.data.content.join(' ') : post.data.description,
            tags: [post.data.tag, ...(post.data.tags || [])],
            type: 'blog',
            icon: 'fa-solid fa-newspaper',
            lang: 'en'
        });
    }

    // 3. Projects. These come from the `cv` collection, which is what /portfolio,
    // /cv and the AI chat all read — the old `portfolio` collection holds four
    // placeholder entries and has no route to point at.
    for (const cvEntry of cvEntries) {
        const lang = cvEntry.id; // 'da' | 'en' | 'de'
        for (const p of cvEntry.data.projects ?? []) {
            if (!p.url) continue;
            // cv/en.json stores un-prefixed paths; send English searchers to the
            // English page where one exists.
            const url = lang === 'en' && p.url.startsWith('/projects/') && enProjectSlugs.has(p.url.slice('/projects/'.length))
                ? `/en${p.url}`
                : p.url;
            index.push({
                title: p.title,
                url,
                content: p.description,
                tags: [p.tag, ...(p.technologies ?? [])].filter(Boolean),
                type: 'project',
                icon: 'fa-solid fa-briefcase',
                lang
            });
        }
    }

    // 4. Videos (The Wandering Economist)
    // These point at each video's own page. They used to point at the index, which
    // predated detail pages existing.
    const trackTags: Record<string, Record<string, string>> = {
        hiking: { da: 'vandring', en: 'hiking', de: 'wandern' },
        economics: { da: 'økonomi', en: 'economics', de: 'wirtschaft' }
    };

    for (const video of videos) {
        for (const lang of ['da', 'en', 'de'] as const) {
            // The index carried only title and description, so a phrase actually
            // spoken in a video was unfindable. Appending the transcript makes the
            // videos searchable by content; capped so one long video cannot
            // dominate the payload every visitor downloads.
            // getVideosNewestFirst flattens entry.data onto the object, so the
            // transcript fields sit directly on `video`, not under `.data`.
            const spoken = resolveTranscript(video, lang);
            const content = spoken.hasTranscript
                ? `${videoDescription(video, lang)} ${spoken.plain}`.slice(0, 4000)
                : videoDescription(video, lang);

            index.push({
                title: videoTitle(video, lang),
                url: videoPath(video.slug, lang),
                content,
                tags: ['video', 'youtube', trackTags[video.track][lang], video.series].filter(Boolean),
                type: 'video',
                icon: 'fa-brands fa-youtube',
                lang
            });
        }
    }

    // 4b. Series pages
    for (const group of groupBySeries(videos)) {
        for (const lang of ['da', 'en', 'de'] as const) {
            const count = group.videos.length;
            index.push({
                title: videoSeriesName(group.videos[0], lang) ?? group.name,
                url: seriesPath(group.slug, lang),
                content: {
                    da: `Serie med ${count} film fra The Wandering Economist.`,
                    en: `A ${count}-part series from The Wandering Economist.`,
                    de: `Eine ${count}-teilige Serie von The Wandering Economist.`
                }[lang],
                tags: ['video', 'youtube', 'series', group.name].filter(Boolean),
                type: 'video',
                icon: 'fa-solid fa-layer-group',
                lang
            });
        }
    }

    // 5. Pages. Ids are "<lang>/<name>"; Danish lives at the site root, the other
    // two under their own prefix. Previously this emitted "/undefined" with every
    // entry hardcoded to English.
    for (const page of pages) {
        if (!page.data.title) continue;
        const [pageLang, ...rest] = page.id.split('/');
        const name = rest.join('/');
        if (!name || !['da', 'en', 'de'].includes(pageLang)) continue;
        index.push({
            title: page.data.title,
            url: pageLang === 'da' ? `/${name}` : `/${pageLang}/${name}`,
            content: page.data.description,
            tags: [],
            type: 'page',
            icon: 'fa-solid fa-file',
            lang: pageLang
        });
    }

    return new Response(JSON.stringify(index), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
        }
    });
}
