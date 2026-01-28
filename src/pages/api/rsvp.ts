
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

// GET: Fetch approved RSVPs
export const GET: APIRoute = async () => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('rsvp')
        .select('name, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// POST: Submit RSVP
export const POST: APIRoute = async ({ request }) => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();

    if (!body.name) {
        return new Response(JSON.stringify({ error: "Navn mangler" }), { status: 400 });
    }

    const { data, error } = await supabase
        .from('rsvp')
        .insert([{
            name: body.name,
            plus_one: body.plus_one || false,
            message: body.message || ""
        }])
        .select();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};
