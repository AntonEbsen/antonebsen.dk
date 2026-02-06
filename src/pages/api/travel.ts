import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
    if (!supabase) {
        return new Response(JSON.stringify([]), { status: 200 });
    }

    try {
        const { data, error } = await supabase
            .from('travel')
            .select('*')
            .order('year', { ascending: false });

        if (error) {
            console.error("Supabase travel error:", error);
            return new Response(JSON.stringify([]), { status: 500 });
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (e) {
        return new Response(JSON.stringify([]), { status: 500 });
    }
}

// POST: Add new travel location
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });

    try {
        const body = await request.json();
        const { error } = await supabase.from('travel').insert([body] as any);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
