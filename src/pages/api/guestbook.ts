
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/ratelimit';

export const prerender = false;

// GET: Fetch messages (admin can fetch all)
export const GET: APIRoute = async ({ url }) => {
    if (!supabase) return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 500 });

    const isAdmin = url.searchParams.get('all') === 'true';
    let query = supabase.from('guestbook').select('*').order('created_at', { ascending: false });

    // If not admin request, only show approved
    if (!isAdmin) {
        query = query.eq('is_approved', true);
    }

    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};

// PUT: Admin actions (Approve / Delete)
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const { id, action } = await request.json();

        if (action === 'approve') {
            await supabase.from('guestbook').update({ is_approved: true }).eq('id', id);
        } else if (action === 'delete') {
            await supabase.from('guestbook').delete().eq('id', id);
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}

// POST: Submit new message (Protected by Honeypot and Rate Limit)
export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 500 });
    }

    try {
        const body = await request.json();
        const { name, message, distraction } = body;

        // 1. HONEYPOT TRAP
        // If 'distraction' field has any value, it's a bot.
        // We return success to confuse them, but do NOT save anything.
        if (distraction) {
            console.warn('Bot attempted spam submission.');
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // 2. Rate Limit
        const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
        const limitParams = await checkRateLimit('guestbook', clientIP);
        if (!limitParams.success) {
            return new Response(JSON.stringify({ error: "Too many messages. Please wait a bit." }), { status: 429 });
        }

        // 3. Validation
        if (!name || !message || name.length > 50 || message.length > 500) {
            return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
        }

        // 4. Insert into Supabase
        const { error } = await supabase
            .from('guestbook')
            // @ts-ignore
            .insert([
                { name, message, is_approved: false } as any // Temporary cast to fix type inference issue
            ]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};
