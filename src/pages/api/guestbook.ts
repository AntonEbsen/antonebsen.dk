
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

// GET: Public = Approved only. Query param 'all=true' = Everything (for dashboard)
export const GET: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(request.url);
    const showAll = url.searchParams.get('all') === 'true';

    let query = supabase.from('guestbook').select('*').order('created_at', { ascending: false });

    if (!showAll) {
        query = query.eq('approved', true);
    }

    const { data, error } = await query;

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Sign Guestbook (Default: Not Approved)
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.message) {
        return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data, error } = await supabase
        .from('guestbook')
        .insert([{
            name: body.name,
            message: body.message,
            approved: false // explicit
        }])
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// PUT: Moderate (Approve) or Delete
export const PUT: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { id, action } = body; // action: 'approve' | 'delete'

    if (action === 'delete') {
        const { error } = await supabase.from('guestbook').delete().eq('id', id);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'approve') {
        const { error } = await supabase.from('guestbook').update({ approved: true }).eq('id', id);
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
};
