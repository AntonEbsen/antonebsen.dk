
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: APIRoute = async ({ request }) => {
    const { data, error } = await supabase
        .from('references')
        .select('*')
        .eq('visible', true)
        .order('id', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();

    // Check if table is "references" (quoted because reserved word) or references
    // Supabase client handles it if we pass the string, usually.
    // If user created "references" with quotes, we might need to be careful.
    // But usually supabase.from('references') works fine.

    const { data, error } = await supabase.from('references').insert([{
        name: body.name,
        role: body.role,
        company: body.company,
        quote: body.quote,
        relationship: body.relationship,
        linkedin_url: body.linkedin_url,
        visible: true
    }]).select();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify(data), { status: 200 });
};
