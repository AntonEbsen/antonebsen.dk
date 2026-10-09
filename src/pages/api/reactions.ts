import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/ratelimit';
import { ReactionSchema } from '../../lib/schemas';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
    }

    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
    }

    try {
        const { data, error } = await (supabase
            .from('blog_reactions') as any)
            .select('reaction_type')
            .eq('slug', slug);

        if (error) throw error;

        // Group by reaction type
        const counts = (data || []).reduce((acc: Record<string, number>, curr: any) => {
            acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1;
            return acc;
        }, {});

        return new Response(JSON.stringify(counts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('[Reactions API Error]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
    }

    try {
        const parsed = ReactionSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: 'Invalid reaction' }), { status: 400 });
        }

        // Anonymous by design — it is on the middleware's public list, as a visitor
        // widget has to be — so it carries its own limit, like the guestbook does.
        const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
        if (!(await checkRateLimit('write', clientIP)).success) {
            return new Response(JSON.stringify({ error: 'Too many reactions. Please wait a bit.' }), { status: 429 });
        }

        const { slug, reaction_type } = parsed.data;

        const { error } = await (supabase
            .from('blog_reactions') as any)
            .insert([{ slug, reaction_type }]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error('[Reactions API Error]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
