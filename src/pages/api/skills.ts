
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

// GET: Fetch skills
export const GET: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('proficiency', { ascending: false });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Add new skill
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();

    const { data, error } = await supabase
        .from('skills')
        .insert([{
            name: body.name,
            category: body.category,
            icon: body.icon,
            proficiency: body.proficiency,
            description: body.description
        }])
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// DELETE: Remove skill
export const DELETE: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });

    const { error } = await supabase.from('skills').delete().eq('id', id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
