import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch posts
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=3600"
        }
    });
}

// POST: Add/Update post
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const body = await request.json();
        // Generate slug if missing
        if (!body.slug) body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const { error } = await supabase.from('posts').insert([body]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// DELETE: Remove post
export const DELETE: APIRoute = async ({ url }) => {
    if (!supabase) return new Response(null, { status: 500 });
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ success: true }));
}
