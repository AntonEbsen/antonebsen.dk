
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ request }) => {
    const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('id', { ascending: false }); // Or sort by date if parsed

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();

    // Ensure JSON fields are valid arrays/objects
    const payload = {
        title: body.title,
        organization: body.organization,
        location: body.location,
        period: body.period,
        type: body.type,
        description: body.description || [], // Array of strings
        highlights: body.highlights || [],   // Array of {label, value}
        links: body.links || [],             // Array of {text, href, icon}
        visible: true
    };

    const { data, error } = await supabase.from('experience').insert([payload]).select();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const DELETE: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('experience').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};
