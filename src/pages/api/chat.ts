
import type { APIRoute } from 'astro';
import { model } from '../../lib/gemini';
import { buildSystemContext } from '../../lib/ai/context';

import { checkRateLimit } from '../../lib/ratelimit';

export const POST: APIRoute = async ({ request, clientAddress }) => {
    // Get IP: clientAddress (SSR) or header (Vercel)
    const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';

    // Upstash Rate Limit
    const limitParams = await checkRateLimit('chat', clientIP);
    if (!limitParams.success) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), { status: 429 });
    }

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
