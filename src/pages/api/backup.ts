import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
    if (!supabase) return new Response("No DB", { status: 500 });

    try {
        const [projects, skills, books, training, quotes, travel, posts] = await Promise.all([
            supabase.from('projects').select('*'),
            supabase.from('skills').select('*'),
            supabase.from('books').select('*'),
            supabase.from('training').select('*'),
            supabase.from('quotes').select('*'),
            supabase.from('travel').select('*'),
            supabase.from('posts').select('*')
        ]);

        const backup = {
            timestamp: new Date().toISOString(),
            projects: projects.data || [],
            skills: skills.data || [],
            books: books.data || [],
            training: training.data || [],
            quotes: quotes.data || [],
            travel: travel.data || [],
            posts: posts.data || []
        };

        return new Response(JSON.stringify(backup, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="quantum-backup-${new Date().toISOString().split('T')[0]}.json"`
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
}
