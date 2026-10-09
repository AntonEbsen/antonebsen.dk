import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { CvExperienceSchema } from '../../../lib/schemas';

export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('cv_experience').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []));
}

export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = CvExperienceSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { error } = await supabase.from('cv_experience').insert([parsed.data]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
