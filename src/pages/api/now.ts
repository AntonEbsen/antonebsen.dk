import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { StatusSchema } from '../../lib/schemas';

// GET: Fetch latest status
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("null");
    const { data } = await supabase.from('status').select('*').order('created_at', { ascending: false }).limit(1).single();
    // The navbar fetches this on every page view, so without a cache header every
    // visit was a Supabase round trip for a value that changes a few times a week.
    return new Response(JSON.stringify(data || null), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
        },
    });
}

// POST: Set new status
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = StatusSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { error } = await supabase.from('status').insert([parsed.data]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
