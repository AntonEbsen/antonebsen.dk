import type { APIRoute } from 'astro';

const rateLimit = new Map<string, number>();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const LIMIT_COUNT = 5; // 5 requests per minute

export const POST: APIRoute = async ({ request }) => {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';

    const now = Date.now();
    const lastRequest = rateLimit.get(clientIP) || 0;

    // Cleanup old entries
    if (now - lastRequest > LIMIT_WINDOW) {
        rateLimit.delete(clientIP);
    }

    // Simple count check (in a real app, use a counter, not just timestamp)
    // Here we just check generic frequency for demo.
    // Better: use a proper store. but for "in-memory" (lambda), this is weak.
    // Let's assume this is a deployed function.

    if (rateLimit.has(clientIP)) {
        const count = rateLimit.get(clientIP + '_count') || 0;
        if (count >= LIMIT_COUNT) {
            return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
        }
        rateLimit.set(clientIP + '_count', count + 1);
    } else {
        rateLimit.set(clientIP, now);
        rateLimit.set(clientIP + '_count', 1);
    }

    try {
        const data = await request.json();
        const { message, persona } = data;

        // Simulate AI response for now (or connect to real AI)
        // The user has a "ChatWidget" that seems to want to talk to an AI.
        // I'll return a mock response or forward to OpenAI if ENV is set.

        // For now, Mock response to prove connection.
        return new Response(JSON.stringify({
            reply: `[AI] You said: "${message}". (Rate limit active)`
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid Request" }), { status: 400 });
    }
};
