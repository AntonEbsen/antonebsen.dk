import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
    const start = Date.now();
    try {
        // Fast ping
        const { error } = await supabase.from('projects').select('id').limit(1);

        if (error) throw error;

        return new Response(JSON.stringify({
            status: "online",
            latency_ms: Date.now() - start,
            timestamp: new Date().toISOString(),
            environment: import.meta.env.MODE
        }), {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Content-Type": "application/json"
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({
            status: "degraded",
            error: String(e),
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: { "Cache-Control": "no-store" }
        });
    }
}
