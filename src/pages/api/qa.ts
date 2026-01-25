
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

// GET: Fetch questions
export const GET: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for admin param to show pending questions
    const url = new URL(request.url);
    const admin = url.searchParams.get('admin');

    let query = supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (admin !== 'true') {
        query = query.eq('status', 'answered');
    }

    const { data, error } = await query;

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Submit new question
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();

    const { data, error } = await supabase
        .from('questions')
        .insert([{
            question: body.question,
            asker_name: body.asker_name || 'Anonymous',
            status: 'pending'
        }])
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// PUT: Answer question
export const PUT: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { id, answer, status } = body;

    const updates: any = {};
    if (answer !== undefined) updates.answer = answer;
    if (status !== undefined) updates.status = status;
    if (answer && !status) updates.status = 'answered';

    const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
