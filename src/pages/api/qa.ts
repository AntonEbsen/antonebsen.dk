import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { verifySession } from '../../lib/session';
import { QaUpdateSchema } from '../../lib/schemas';

// GET: Fetch questions
export const GET: APIRoute = async ({ url, cookies }) => {
    if (!supabase) return new Response("[]");

    // `?admin=true` also returns the pending and hidden questions — the moderation
    // queue. It used to be a bare query flag that anyone could set: the middleware
    // guards writes and the two GET routes it names, and this was not one of them.
    const wantsAll = url.searchParams.get('admin') === 'true';
    if (wantsAll && !verifySession(cookies.get('auth_token')?.value)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let query = supabase.from('qa').select('*').order('created_at', { ascending: false });

    if (!wantsAll) {
        query = query.eq('status', 'answered');
    }

    const { data } = await query;
    return new Response(JSON.stringify(data || []));
}

// PUT: Answer or Hide
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const parsed = QaUpdateSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400 });
        }
        const { id, answer, status } = parsed.data;
        const update: { status: typeof status; answer?: string } = { status };
        if (answer) update.answer = answer;

        const { error } = await supabase.from('qa').update(update).eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
