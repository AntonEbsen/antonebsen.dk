
import type { APIRoute } from 'astro';
import { supabase } from '@lib/supabase';

// GET: Fetch latest data for polling
export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const table = url.searchParams.get('table');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 10;
    const orderBy = url.searchParams.get('orderBy') || 'created_at';
    const ascending = url.searchParams.get('ascending') === 'true';

    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
    }

    if (!table) return new Response(JSON.stringify({ error: 'Table required' }), { status: 400 });

    let query = supabase.from(table).select('*');

    // Simple order handling
    query = query.order(orderBy, { ascending });

    if (limit) query = query.limit(limit);

    // Specific filters can be added here if needed
    if (table === 'study_active_timers') {
        const activeOnly = url.searchParams.get('activeOnly') === 'true';
        if (activeOnly) query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify(data), { status: 200 });
}

// POST: Insert or Update data
export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const { table, data, action, match } = body;

    if (!supabase) {
        return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
    }

    if (!table || !data) return new Response(JSON.stringify({ error: 'Table and data required' }), { status: 400 });

    let result;

    if (action === 'insert') {
        result = await supabase.from(table).insert(data).select();
    } else if (action === 'upsert') {
        result = await supabase.from(table).upsert(data, { onConflict: match }).select();
    } else if (action === 'update') {
        let q = supabase.from(table).update(data);
        if (match) {
            // match is object { column: value }
            for (const [key, val] of Object.entries(match)) {
                q = q.eq(key, val);
            }
        }
        result = await q.select();
    } else {
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

    if (result.error) return new Response(JSON.stringify({ error: result.error.message }), { status: 500 });

    return new Response(JSON.stringify(result.data), { status: 200 });
}
