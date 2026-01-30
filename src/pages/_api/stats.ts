
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    // 1. Initialize Supabase
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return new Response(JSON.stringify({ error: 'Database Config Missing' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 2. Fetch Data
        // We'll fetch all rows (limit 1000 for now to be safe) and aggregate in memory 
        // because it's faster for small datasets than complex SQL group-bys over HTTP.
        const { data, error } = await supabase
            .from('chat_logs')
            .select('id, created_at, persona, intent, user_message, ai_response')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;

        if (!data || data.length === 0) {
            return new Response(JSON.stringify({
                total: 0,
                personas: {},
                activity: {},
                recent: []
            }), { status: 200 });
        }

        // 3. Process Data for Charts

        // A. Persona Distribution
        const personas: Record<string, number> = {};
        data.forEach(row => {
            const p = row.persona || 'Unknown';
            personas[p] = (personas[p] || 0) + 1;
        });

        // B. Intent Distribution (Top 5)
        const intents: Record<string, number> = {};
        data.forEach(row => {
            const i = row.intent || 'General';
            intents[i] = (intents[i] || 0) + 1;
        });

        // C. Activity Over Time (By Date)
        const activity: Record<string, number> = {};
        data.forEach(row => {
            const date = new Date(row.created_at).toISOString().split('T')[0]; // YYYY-MM-DD
            activity[date] = (activity[date] || 0) + 1;
        });

        // 4. Return Summary
        return new Response(JSON.stringify({
            total: data.length,
            personas,
            intents,
            activity,
            recent: data.slice(0, 50) // Send top 50 recents for the table
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error("Stats API Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
