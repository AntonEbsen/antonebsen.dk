import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
    // Cache for 1 hour to speed up client search
    const responseHeaders = {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
    };

    if (!supabase) return new Response("[]", { headers: responseHeaders });

    // Fetch all content concurrently
    const [projects, posts, books, quotes] = await Promise.all([
        supabase.from('projects').select('title, description, url, tags'),
        supabase.from('posts').select('title, slug, date, tags'),
        supabase.from('books').select('title, author, status, rating'),
        supabase.from('quotes').select('text, author, tags')
    ]);

    const index = [
        // Admin Actions (for Command Mode)
        { title: "Dashboard", url: "/dashboard", type: "command", icon: "fa-gauge" },
        { title: "Backup Data", url: "/api/backup", type: "command", icon: "fa-download" },
        { title: "Add Project", url: "/dashboard?action=add-project", type: "command", icon: "fa-plus" },

        // Content
        ...((projects.data as any[]) || []).map(p => ({
            title: p.title,
            description: p.description,
            url: p.url || '#', // External or internal
            tags: p.tags,
            type: 'project',
            icon: 'fa-code'
        })),
        ...((posts.data as any[]) || []).map(p => ({
            title: p.title,
            url: `/blog/${p.slug}`,
            tags: p.tags,
            type: 'blog',
            icon: 'fa-newspaper'
        })),
        ...((books.data as any[]) || []).map(b => ({
            title: `${b.title} by ${b.author}`,
            url: '/library',
            type: 'book',
            icon: 'fa-book'
        })),
        ...((quotes.data as any[]) || []).map(q => ({
            title: `Quote: "${q.text.substring(0, 30)}..."`,
            url: '/quotes',
            type: 'quote',
            icon: 'fa-quote-right'
        }))
    ];

    return new Response(JSON.stringify(index), { headers: responseHeaders });
}
