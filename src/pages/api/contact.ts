import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/ratelimit';
import { z } from 'zod';

export const prerender = false;

const ContactSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(200),
    message: z.string().min(1).max(2000),
    company: z.string().optional() // Honeypot
});

// GET: Fetch inbox messages (protected by middleware auth cookie)
export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []), {
        headers: { 'Content-Type': 'application/json' }
    });
};

// POST: Submit a new message (public — protected by honeypot + rate limit)
export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 500 });
    }

    try {
        const parsed = ContactSchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.format() }), { status: 400 });
        }

        const { name, email, message, company } = parsed.data;

        // 1. Honeypot: if the hidden field is filled, it's a bot.
        // Return success to avoid tipping it off, but save nothing.
        if (company) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        // 2. Rate limit by IP
        const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
        const limit = await checkRateLimit('contact', clientIP);
        if (!limit.success) {
            return new Response(JSON.stringify({ error: 'Too many messages. Please wait a bit.' }), { status: 429 });
        }

        // 3. Persist
        const { error } = await supabase
            .from('contact_messages')
            // @ts-ignore - cast to satisfy generated Insert type inference
            .insert([{ name, email, message, read: false } as any]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[Contact API Error]:', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
};

// PUT: Mark as read/unread (protected by middleware auth cookie)
export const PUT: APIRoute = async ({ request }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const { id, read } = await request.json();
        const { error } = await supabase.from('contact_messages').update({ read } as any).eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
    }
};
