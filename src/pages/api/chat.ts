
import type { APIRoute } from 'astro';
import { model } from '../../lib/gemini';
import { buildSystemContext } from '../../lib/ai/context';

const rateLimit = new Map<string, number>();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const LIMIT_COUNT = 10; // 10 requests per minute

export const POST: APIRoute = async ({ request }) => {
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    // Rate Limiting Logic
    const lastRequest = rateLimit.get(clientIP) || 0;
    if (now - lastRequest > LIMIT_WINDOW) {
        rateLimit.delete(clientIP); // Reset window
    }

    const count = rateLimit.get(clientIP + '_count') || 0;
    if (count >= LIMIT_COUNT) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), { status: 429 });
    }

    rateLimit.set(clientIP, now);
    rateLimit.set(clientIP + '_count', count + 1);

    try {
        const data = await request.json();
        const { message, lang = 'en' } = data;

        if (!message) {
            return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
        }

        // Build Context
        const systemInstruction = buildSystemContext(lang);

        // Start Chat Session
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to represent Anton." }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 300,
            },
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        return new Response(JSON.stringify({ reply }), { status: 200 });

    } catch (error) {
        console.error("Gemini Error:", error);
        return new Response(JSON.stringify({ error: "Internal AI Error" }), { status: 500 });
    }
};
