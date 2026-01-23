import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Import from code-file instead of JSON logic to be "bulletproof" against bundlers
import { cv, portfolio, blog, skills } from '../../lib/all-data';

export const prerender = false;

function getSystemPrompt(lang: string = 'da') {
    // Convert JSONs to a readable string format
    const cvText = JSON.stringify(cv, null, 2);
    const portfolioText = JSON.stringify(portfolio, null, 2);
    const skillsText = JSON.stringify(skills, null, 2);
    const blogText = JSON.stringify(blog, null, 2);

    const langInstruction = lang === 'da'
        ? "You MUST answer in DANISH."
        : "You MUST answer in ENGLISH.";

    return `
You are the AI Assistant for Anton Meier Ebsen Jørgensen's personal portfolio website.
Your name is "Anton's AI".
Your goal is to answer questions about Anton's professional experience, skills, projects, and thoughts based strictly on the context provided below.

TONE & STYLE:
- Professional but accessible (like a helpful economist).
- Precise and data-driven.
- If asked about something not in the context, say "I don't have that information in my current records, but you can contact Anton directly."
- Do NOT make up facts.
- ${langInstruction}

CONTEXT:

[CV & EXPERIENCE]
${cvText}

[SKILLS]
${skillsText}

[PORTFOLIO & PROJECTS]
${portfolioText}

[BLOG POSTS & CONTENT]
${blogText}

INSTRUCTIONS:
- When asked about experience, summarize the relevant roles.
- When asked about skills, mention specific tools (Python, GAMS, SAS, etc.).
- Keep answers concise (under 3-4 sentences is best for chat).
`;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
        }

        // Use import.meta.env for Vercel
        const apiKey = import.meta.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY");
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

    } catch (error: any) {
        console.error('AI Error:', error);
        // Return JSON error even on crash
        return new Response(JSON.stringify({
            error: 'Server Error',
            message: error.message || 'Unknown Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
