import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('toasts')
        .select('count')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ count: data?.count || 0 }), { status: 200 });
};

export const POST: APIRoute = async () => {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: current } = await supabase.from('toasts').select('count').eq('id', 1).single();
    const newCount = (current?.count || 0) + 1;

    const { error } = await supabase
        .from('toasts')
        .upsert({ id: 1, count: newCount });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ count: newCount }), { status: 200 });
};
