export const prerender = false;

import type { APIRoute } from 'astro';
import { model } from '../../lib/gemini';
import { buildSystemContext } from '../../lib/ai/context';

import { checkRateLimit } from '../../lib/ratelimit';

import { ragContent } from '../../lib/generated-rag';

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({
        status: "Chat API is online",
        has_gemini_key: !!import.meta.env.GEMINI_API_KEY,
        has_upstash_key: !!import.meta.env.UPSTASH_REDIS_REST_URL,
        rag_size: ragContent?.length || 0
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
export const POST: APIRoute = async ({ request, clientAddress }) => {
    const GEMINI_KEY = import.meta.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
        console.error("DEBUG: GEMINI_API_KEY is missing");
        return new Response(JSON.stringify({
            error: true,
            message: "⚠️ Configuration Error: Gemini API key is missing on the server. Please check Vercel environment variables."
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Get IP: clientAddress (SSR) or header (Vercel)
    const clientIP = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';

    // Upstash Rate Limit
    try {
        const limitParams = await checkRateLimit('chat', clientIP);
        if (!limitParams.success) {
            return new Response(JSON.stringify({ error: true, message: "Too many requests. Please wait a moment." }), { status: 429 });
        }
    } catch (e) {
        console.warn("Rate limit check failed, proceeding anyway", e);
    }

    try {
        const data = await request.json();
        const { message, lang = 'en', persona = 'default', image } = data;

        if (!message && !image) {
            return new Response(JSON.stringify({ error: "Message or Image is required" }), { status: 400 });
        }

        // Build Context
        let systemInstruction = buildSystemContext(lang);

        // Add RAG Content (Knowledge from Thesis/Docs)
        if (ragContent) {
            systemInstruction += `\n\n[KNOWLEDGE BASE / RAG CONTENT]:\n${ragContent}`;
        }

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
                    parts: [{ text: `Understood. I am ready to represent Anton in ${persona} mode, using the provided knowledge base (RAG).` }],
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

    } catch (error: any) {
        console.error("Gemini/API Error:", error);

        // Return a more descriptive error if possible
        const errorMessage = error.message || "Internal AI Error";
        return new Response(JSON.stringify({
            error: true,
            message: `⚠️ AI Error: ${errorMessage}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
