import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch inbox messages
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

// PUT: Mark as read/unread
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const { id, read } = await request.json();
        const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
