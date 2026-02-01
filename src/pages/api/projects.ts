import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET: Fetch all projects
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=3600"
        }
    });
}

import { ProjectSchema } from "../../lib/schemas";

// POST: Add specific project
export const POST: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });

    try {
        const body = await request.json();
        const validation = ProjectSchema.safeParse(body);

        if (!validation.success) {
            return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
        }

        const { error } = await supabase.from('projects').insert([validation.data]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// DELETE: Remove project
export const DELETE: APIRoute = async ({ url }) => {
    if (!supabase) return new Response(null, { status: 500 });
    const id = url.searchParams.get("id");
    if (!id) return new Response("Missing ID", { status: 400 });

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify({ success: true }));
}
