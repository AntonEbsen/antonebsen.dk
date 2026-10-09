import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { verifySession } from '../../lib/session';
import { QaUpdateSchema, QaQuestionSchema } from '../../lib/schemas';
import { checkRateLimit } from '../../lib/ratelimit';

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

// POST: a visitor asks a question.
//
// The /qa form has POSTed here for as long as it has existed, and nothing answered:
// the route had GET and PUT only, so every submission got a 404, the form showed its
// error message, and the question was gone. Public (listed in the middleware's
// public-POST set), with its own schema and the contact form's rate limit.
export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });

    const parsed = QaQuestionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid question' }), { status: 400 });
    }

    const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
    if (!(await checkRateLimit('contact', clientIP)).success) {
        return new Response(JSON.stringify({ error: 'Too many questions. Please wait a bit.' }), { status: 429 });
    }

    try {
        const { question, asker_name } = parsed.data;
        const { error } = await supabase.from('qa').insert([{
            question,
            asker_name: asker_name || undefined,
            status: 'pending',
        }]);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        console.error('[QA API Error]', e);
        return new Response(JSON.stringify({ error: 'Could not save the question.' }), { status: 500 });
    }
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
