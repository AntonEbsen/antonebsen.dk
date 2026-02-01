import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const body = await request.json();
        const { error } = await supabase.from('media').insert([body]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
