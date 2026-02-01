import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch all projects
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

// POST: Add specific project
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });

    try {
        const body = await request.json();
        const { error } = await supabase.from('projects').insert([body]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// DELETE: Remove project
export const DELETE: APIRoute = async ({ url }) => {
    if (!supabase) return new Response(null, { status: 500 });
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ success: true }));
}
