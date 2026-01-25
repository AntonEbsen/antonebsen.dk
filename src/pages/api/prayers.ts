
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

// GET: Fetch recent prayers
export const GET: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Add new prayer
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const body = await request.json();

        // Basic Validation
        if (!body.content || body.content.length > 500) {
            return new Response(JSON.stringify({ error: "Invalid content length" }), { status: 400 });
        }

        const { data, error } = await supabase
            .from('prayers')
            .insert([{
                content: body.content,
                author: body.author || 'Anonym'
            }])
            .select();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify(data), { status: 200 });

    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid Request" }), { status: 400 });
    }
};
