
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ request }) => {
    const { data, error } = await supabase
        .from('media_mentions')
        .select('*')
        .eq('visible', true)
        .order('date', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();

    const { data, error } = await supabase.from('media_mentions').insert([{
        title: body.title,
        source: body.source,
        url: body.url,
        date: body.date,
        image_url: body.image_url,
        visible: true
    }]).select();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};
