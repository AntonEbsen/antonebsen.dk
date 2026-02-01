import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch latest status
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("null");
    const { data } = await supabase.from('status').select('*').order('created_at', { ascending: false }).limit(1).single();
    return new Response(JSON.stringify(data || null));
}

// POST: Set new status
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const body = await request.json();
        const { error } = await supabase.from('status').insert([body]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
