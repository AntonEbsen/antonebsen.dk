import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { BucketListInputSchema, BucketListUpdateSchema } from '../../lib/schemas';

// GET: Fetch goals
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('bucketlist').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

// POST: Add goal
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = BucketListInputSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { error } = await supabase.from('bucketlist').insert([parsed.data]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// PUT: Update status
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = BucketListUpdateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { id, status } = parsed.data;
        const { error } = await supabase.from('bucketlist').update({ status }).eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
