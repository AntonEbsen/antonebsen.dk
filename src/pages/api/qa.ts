import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch questions
export const GET: APIRoute = async ({ url }) => {
    if (!supabase) return new Response("[]");

    // Admin request (see all) vs Public (only answered)
    const isAdmin = url.searchParams.get('admin') === 'true';
    let query = supabase.from('qa').select('*').order('created_at', { ascending: false });

    if (!isAdmin) {
        query = query.eq('status', 'answered');
    }

    const { data } = await query;
    return new Response(JSON.stringify(data || []));
}

// PUT: Answer or Hide
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const { id, answer, status } = await request.json();
        const update: any = { status };
        if (answer) update.answer = answer;

        const { error } = await supabase.from('qa').update(update).eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
