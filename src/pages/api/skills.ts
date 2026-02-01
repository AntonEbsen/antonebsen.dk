import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch all skills
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('skills').select('*').order('proficiency', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

// POST: Add new skill
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const body = await request.json();
        // Ensure proficiency is integer
        const { error } = await supabase.from('skills').insert([body]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// DELETE: Remove skill
export const DELETE: APIRoute = async ({ url }) => {
    if (!supabase) return new Response(null, { status: 500 });
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ success: true }));
}
