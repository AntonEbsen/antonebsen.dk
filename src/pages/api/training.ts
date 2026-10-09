import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { TrainingSchema } from '../../lib/schemas';

export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('training').select('*').order('date', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = TrainingSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { error } = await supabase.from('training').insert([parsed.data]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
