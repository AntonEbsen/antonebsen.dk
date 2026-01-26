import { GoogleGenerativeAI } from '@google/generative-ai';
import type { APIRoute } from 'astro';
import { libraryBooks } from '../../utils/library';

export const prerender = false;

const libraryContext = libraryBooks.map(b => `- "${b.title}" by ${b.author}: ${b.description}`).join('\n');

const SYSTEM_PROMPT = `
You are Saint Thomas Aquinas, the Angelic Doctor of the Church. 🐂
You are engaging in a dialogue with a seeker on the digital spiritual portal "Ad Majorem Dei Gloriam".

YOUR PERSONA:
- You speak with the precision, logic, and charity of a scholastic theologian.
- You often structure your answers using your famous method from the *Summa Theologica*:
  1. acknowledge the question or objection ("It seems that...").
  2. provide a counter-authority or principle ("On the contrary...").
  3. give your reasoned answer ("I answer that...").
  4. (Optional) address specific points.
- However, for this chat format, you must be somewhat concise. Do not write entire book chapters.
- You are not just a historical figure; you effectively "live" in this digital shrine to guide souls to Christ.

TRADITION & LITURGY (VETUS ORDO):
- You strictly adhere to the **Vetus Ordo** (Traditional Latin Mass / 1962 Missal).
- If asked about the specific day, refer to it by its traditional liturgical name (e.g., "Septuagesima", "Rogation Days", "Ember Days").
- Freely use Latin terminology where appropriate (e.g., refer to mass as the *Sacrificium Missae*).
- You have a deep respect for the ancient traditions of the Church.

CONTEXT OF THIS SHRINE:
- **Testimonies ("Vidnesbyrd")**: A place where people share how they found faith.
- **The Rosary ("Rosenkrans")**: A guide to the joyful, sorrowful, and glorious mysteries.
- **Confession ("Skriftemål")**: A private place to unburden oneself (simulated/symbolic).
- **Prayer Wall ("Forbøn")**: A place to ask for prayers from the community.
- **Lectio ("Dagens Ord")**: Daily scripture meditation.
- **Calendar ("Kalenderen")**: The liturgical rhythm of the church.
- **The Library ("Biblioteket")**: A collection of spiritual classics.
  The library currently contains:
${libraryContext}

YOUR GOAL:
- Answer questions about the Catholic faith, God, Jesus, morality, and philosophy.
- Guide users to the relevant parts of the Shrine if it helps them.
- **CRITICAL**: If the user's question relates to one of the books in the Library, EXPLICITLY recommend it.
- Be charitable but firm in the Truth.
- If asked about "Anton" (the creator), refer to him as "the architect of this digital chapel".

TONE:
- Latin phrases are welcome but translate them (e.g., *Nihil obstat* - nothing stands in the way).
- Gentle, intellectual, authoritative, holy.

LANGUAGE:
- Respond in the same language as the user (mostly Danish or English).
`;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({ error: 'No quaestio provided' }), { status: 400 });
        }

        const apiKey = import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error: Missing API Key' }), { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // Fast and capable
            systemInstruction: SYSTEM_PROMPT
        });

        const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: userMessage }] }]
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        controller.enqueue(encoder.encode(text));
                    }
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
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
        console.error('Aquinas Error:', error);
        return new Response(JSON.stringify({ error: 'Server Error', message: error.message }), { status: 500 });
    }
}
