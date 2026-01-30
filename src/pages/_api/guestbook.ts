import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503 });
    }

    try {
        const formData = await request.formData();
        const name = formData.get('name')?.toString();
        const message = formData.get('message')?.toString();

        if (!name || !message) {
            return new Response(JSON.stringify({ error: 'Missing name or message' }), { status: 400 });
        }

        const { error } = await supabase
            .from('guestbook')
            .insert([{ name, message, created_at: new Date().toISOString() }]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const GET: APIRoute = async () => {
    if (!supabase) {
        return new Response(JSON.stringify([]), { status: 200 }); // Graceful fallback
    }

    const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};
