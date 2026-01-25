
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ request }) => {
    const { data, error } = await supabase
        .from('education')
        .select('*')
        .order('id', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();

    const payload = {
        institution: body.institution,
        degree: body.degree,
        period: body.period,
        description: body.description,
        bullets: body.bullets || [],         // Array of strings
        technologies: body.technologies || [], // Array of strings
        visible: true
    };

    const { data, error } = await supabase.from('education').insert([payload]).select();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('education').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
