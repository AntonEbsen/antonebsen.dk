import { getCollection } from 'astro:content';

export async function GET() {
    const posts = await getCollection('blog');
    const projects = await getCollection('portfolio');
    const pages = await getCollection('pages');

    const index = [];

    // 1. Admin / Static Commands
    const commands = [
        { title: "Dashboard", url: "/dashboard", type: "command", icon: "fa-gauge", tags: ["admin"], lang: "en" },
        { title: "Backup Data", url: "/api/backup", type: "command", icon: "fa-download", tags: ["admin"], lang: "en" },
        { title: "Trophy Room", url: "#trophy-room", type: "command", icon: "fa-trophy", tags: ["game"], lang: "en" },
        { title: "Trophäenraum", url: "#trophy-room", type: "command", icon: "fa-trophy", tags: ["game"], lang: "de" },
        { title: "Trophy Room", url: "#trophy-room", type: "command", icon: "fa-trophy", tags: ["spil"], lang: "da" },
        { title: "CV", url: "/cv", type: "page", icon: "fa-file-pdf", tags: ["resume"], lang: "en" },
        { title: "CV", url: "/da/cv", type: "page", icon: "fa-file-pdf", tags: ["cv"], lang: "da" },
        { title: "Lebenslauf", url: "/de/cv", type: "page", icon: "fa-file-pdf", tags: ["lebenslauf"], lang: "de" }
    ];
    index.push(...commands);

    // 2. Blog Posts (Multi-language)
    for (const post of posts) {
        // English
        index.push({
            title: post.data.title,
            url: `/blog/${post.slug}`,
            content: Array.isArray(post.data.content) ? post.data.content.join(' ') : post.data.description,
            tags: [post.data.tag, ...(post.data.tags || [])],
            type: 'blog',
            icon: 'fa-newspaper',
            lang: 'en'
        });

        // Danish
        if (post.data.title_da) {
            index.push({
                title: post.data.title_da,
                url: `/da/blog/${post.slug}`,
                content: Array.isArray(post.data.content_da) ? post.data.content_da.join(' ') : (post.data.description_da || post.data.description),
                tags: [post.data.tag, ...(post.data.tags || [])],
                type: 'blog',
                icon: 'fa-newspaper',
                lang: 'da'
            });
        }
    }

    // 3. Projects
    for (const project of projects) {
        index.push({
            title: project.data.title,
            url: `/portfolio/${project.slug}`,
            content: project.data.description,
            tags: project.data.tags || [],
            type: 'project',
            icon: 'fa-briefcase',
            lang: 'en' // Projects might be English only or mixed
        });
        // Add Danish version if project structure supports it (assuming en default for now)
        index.push({
            title: project.data.title, // Or title_da if exists
            url: `/da/portfolio/${project.slug}`,
            content: project.data.description,
            tags: project.data.tags || [],
            type: 'project',
            icon: 'fa-briefcase',
            lang: 'da'
        });
    }

    // 4. Pages
    for (const page of pages) {
        if (page.data.title) {
            index.push({
                title: page.data.title,
                url: `/${page.slug}`,
                content: page.data.description,
                tags: [],
                type: 'page',
                icon: 'fa-file',
                lang: 'en'
            });
        }
    }

    return new Response(JSON.stringify(index), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
        }
    });
}
