
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
        const { message, lang = 'en', persona = 'default', image } = data;

        if (!message && !image) {
            return new Response(JSON.stringify({ error: "Message or Image is required" }), { status: 400 });
        }

        // Build Context
        let systemInstruction = buildSystemContext(lang);
        if (persona !== 'default') {
            systemInstruction += `\n\n[ADOPT PERSONA: ${persona.toUpperCase()}]\nAdjust tone and complexity accordingly.`;
        }

        // Start Chat Session
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: `Understood. I am ready to represent Anton in ${persona} mode.` }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Prepare message parts (Text + Image)
        const parts: any[] = [];
        if (message) parts.push({ text: message });
        if (image) {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }

        const result = await chat.sendMessageStream(parts);

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        controller.enqueue(encoder.encode(text));
                    }
                } catch (e) {
                    console.error("Stream Error", e);
                    controller.error(e);
                }
                controller.close();
            }
        });

        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error) {
        console.error("Gemini Error:", error);
        return new Response(JSON.stringify({ error: "Internal AI Error" }), { status: 500 });
    }
};
