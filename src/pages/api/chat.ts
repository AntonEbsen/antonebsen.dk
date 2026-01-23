import type { APIRoute } from 'astro';
import OpenAI from 'openai';
import { getSystemPrompt } from '../../lib/ai-context';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
        }

        const apiKey = import.meta.env.OPENAI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({
                error: 'Configuration Error',
                message: 'Missing OPENAI_API_KEY. Please add it to your .env file.'
            }), { status: 500 });
        }

        const openai = new OpenAI({ apiKey: apiKey });

        // Get the dynamic context (CV, projects, etc.)
        const systemPrompt = getSystemPrompt();

        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective and fast
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;

        return new Response(JSON.stringify({ reply }), {
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
