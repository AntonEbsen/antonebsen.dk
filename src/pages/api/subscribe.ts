import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/ratelimit';
import { z } from 'zod';

export const prerender = false;

const SubscribeSchema = z.object({
    email: z.string().email(),
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) {
        return new Response(JSON.stringify({ error: "Database connection unavailable." }), { status: 500 });
    }

    try {
        const body = await request.json();
        const result = SubscribeSchema.safeParse(body);

        if (!result.success) {
            return new Response(JSON.stringify({ error: "Ugyldig e-mail adresse." }), { status: 400 });
        }

        // Rate limit by IP
        const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
        const limit = await checkRateLimit('subscribe', clientIP);
        if (!limit.success) {
            return new Response(JSON.stringify({ error: "For mange forsøg. Prøv igen om lidt." }), { status: 429 });
        }

        const { email } = result.data;

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return new Response(JSON.stringify({ message: "Du er allerede tilmeldt!" }), { status: 200 });
        }

        const { error } = await (supabase as any)
            .from('subscribers')
            .insert({ email });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "Velkommen til Signalet!" }), { status: 200 });
    } catch (e) {
        console.error('[Subscribe API Error]:', e);
        return new Response(JSON.stringify({ error: "Der skete en fejl. Prøv igen senere." }), { status: 500 });
    }
};
