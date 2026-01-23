import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from '@lib/ai-context';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
        }

        const apiKey = import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({
                error: 'Configuration Error',
                message: 'Missing GEMINI_API_KEY. Please add it to your .env file.'
            }), { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const lang = body.lang || 'da';
        const systemPrompt = getSystemPrompt(lang);

        // Initialize model with system instruction
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ reply: text }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('AI Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate response' }), { status: 500 });
    }
}
