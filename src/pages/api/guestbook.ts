
import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

// GET: Fetch all approved messages
export const GET: APIRoute = async () => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 500 });
    }

    const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// POST: Submit new message (Protected by Honeypot)
export const POST: APIRoute = async ({ request }) => {
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

        // 2. Validation
        if (!name || !message || name.length > 50 || message.length > 500) {
            return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
        }

        // 3. Insert into Supabase
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
