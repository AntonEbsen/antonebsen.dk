import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { QuoteSchema } from '../../lib/schemas';
import { logAudit } from '../../lib/audit';

export const GET: APIRoute = async () => {
    if (!supabase) return new Response("[]");
    const { data } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
    return new Response(JSON.stringify(data || []), {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60, s-maxage=3600" }
    });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!supabase) return new Response(JSON.stringify({ error: "No DB" }), { status: 500 });
    try {
        const body = await request.json();
        const validation = QuoteSchema.safeParse(body);

        if (!validation.success) {
            return new Response(JSON.stringify({ error: validation.error }), { status: 400 });
        }

        const { error } = await supabase.from('quotes').insert([validation.data]);
        if (error) throw error;

        logAudit("CREATE", "QUOTE", validation.data, clientAddress || "unknown");

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e }), { status: 500 });
    }
}
