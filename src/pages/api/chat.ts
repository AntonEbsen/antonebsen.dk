import type { APIRoute } from 'astro';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Import from code-file instead of JSON logic to be "bulletproof" against bundlers
import { cv, portfolio, blog, skills, training } from '../../lib/all-data';

export const prerender = false;

function getSystemPrompt(lang: string = 'da') {
    // Convert JSONs to a readable string format
    const cvText = JSON.stringify(cv, null, 2);
    const portfolioText = JSON.stringify(portfolio, null, 2);
    const skillsText = JSON.stringify(skills, null, 2);
    const blogText = JSON.stringify(blog, null, 2);
    const trainingText = JSON.stringify(training, null, 2);

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

[TRAINING & FITNESS]
${trainingText}

INSTRUCTIONS:
- When asked about experience, summarize the relevant roles.
- When asked about skills, mention specific tools (Python, GAMS, SAS, etc.).
- Keep answers concise (under 3-4 sentences is best for chat).

CHARTS & GRAPHS:
If the user asks for a visualization, graph, or statistics (e.g. "show skills graph", "visualize your experience"), YOU MUST output a JSON block for Chart.js.
Format:
<<<CHART
{
  "type": "bar",
  "data": {
    "labels": ["Label1", "Label2"],
    "datasets": [{ "label": "Title", "data": [10, 20], "backgroundColor": "rgba(255, 215, 0, 0.5)" }]
  },
  "options": { "responsive": true }
}
CHART>>>


NAVIGATION:
If the user asks to see a specific page, section, or content that exists on the site, YOU MUST output a navigation block.
Format: <<<NAVIGATE: /path>>>
- Do NOT provide a markdown link like [Blog](/blog).
- Do NOT bold the tag (e.g. **<<<NAVIGATE...>>>** is BAD).
- Do NOT ask if they want to go there. JUST GO.
- Output the block on its own line.

Valid Paths:
- / (Home)
- /portfolio (Projects & Cases)
- /blog (All posts)
- /books (Book list)
- /podcasts (Podcast list)
- /quotes (Quotes)
- /traeningsstatistik (Training Data)
- /map (Travel Map)
- /contact (Contact info from Home)
- /en/ (English Home)

SUGGESTIONS:
After every answer, generate 3 short, relevant follow-up questions the user might want to ask next.
Format: <<<SUGGESTIONS: ["Question 1", "Question 2", "Question 3"]>>>
- Keep them short (max 5-6 words).
- Make them specific to the previous context.
- Output this block at the very end of your response.

Pre-defined Charts you can generate:
1. "Skill Levels": Bar chart of top skills (Python: 90, GAMS: 85, Excel: 95, Macro: 90, Stata: 75).
2. "Experience Timeline": Bar chart of years per role.
3. "Projects by Type": Pie chart (Macro: 30, Data: 40, Models: 30).
4. "Training Volume": Line chart of weekly tonnage (Uge 1: 40.5, Uge 2: 42.1, etc).
`;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
        }

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

        const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash"];

        let streamResult: any = null;
        let lastError: any = null;

        // Try models until one works
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                streamResult = await model.generateContentStream(userMessage);
                // If we get here without throwing, the stream request initiated successfully
                break;
            } catch (err: any) {
                console.warn(`Failed with model ${modelName}:`, err.message);
                lastError = err;
                continue;
            }
        }

        if (!streamResult) {
            throw lastError || new Error("All models failed to respond.");
        }

        // Create a readable stream from the Gemini stream
        const responseStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of streamResult.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(encoder.encode(chunkText));
                    }
                    controller.close();
                } catch (err) {
                    console.error("Stream Error:", err);
                    controller.error(err);
                }
            }
        });

        return new Response(responseStream, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error: any) {
        console.error('AI Error:', error);
        return new Response(JSON.stringify({
            error: 'Server Error',
            message: error.message || 'Unknown Server Error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
