import { createClient } from '@supabase/supabase-js';
// Import from code-file instead of JSON logic to be "bulletproof" against bundlers
import { cv, portfolio, blog, skills, training } from '../../lib/all-data';
// RAG Content (Generated at build time)
import { ragContent } from '../../lib/generated-rag';

export const prerender = false;

// ... (keep system prompt logic same) ...

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const userMessage = body.message;

        // ... (keep generic validation) ...

        const apiKey = import.meta.env.GEMINI_API_KEY;
        // Verify Supabase keys immediately
        const supabaseUrl = import.meta.env.SUPABASE_URL;
        const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

        console.log("🔍 API Debug | Keys:", {
            hasGemini: !!apiKey,
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseKey
        });

        // Initialize Supabase Client
        const supabase = (supabaseUrl && supabaseKey)
            ? createClient(supabaseUrl, supabaseKey)
            : null;

        if (!supabase) console.warn("⚠️ Supabase client failed to initialize.");
        // Load RAG content from generated file
        const documentContext = ragContent;

        // Convert JSONs to a readable string format
        const cvText = JSON.stringify(cv, null, 2);
        const portfolioText = JSON.stringify(portfolio, null, 2);
        const skillsText = JSON.stringify(skills, null, 2);
        const blogText = JSON.stringify(blog, null, 2);
        const trainingText = JSON.stringify(training, null, 2);

        const langInstruction = lang === 'da'
            ? "You MUST answer in DANISH."
            : "You MUST answer in ENGLISH.";

        let personaInstruction = "";
        if (persona === 'recruiter') {
            personaInstruction = `
        PERSONA: RECRUITER / HR MANAGER 💼
        - Focus on ROI, business impact, and "soft skills".
        - Highlight leadership, communication, and adaptability.
        - Use professional, results-oriented language.
        - Emphasize "why hire Anton" rather than technical minutiae.
        `;
        } else if (persona === 'tech') {
            personaInstruction = `
        PERSONA: TECH LEAD / CTO 💻
        - Focus on technical stack, architecture, and code quality.
        - Highlight specific libraries (e.g. Scikit-learn, Astro, GAMS), algorithms, and data structures.
        - Be precise and technical.
        - Discuss complexity and trade-offs.
        `;
        } else if (persona === 'eli5') {
            personaInstruction = `
        PERSONA: ELI5 (Explain Like I'm 5) 👶
        - Explain complex economic or technical concepts using simple analogies.
        - No jargon.
        - Keep it fun and educational.
        `;
        }

        return `
You are the AI Assistant for Anton Meier Ebsen Jørgensen's personal portfolio website.
Your name is "Anton's AI".
${personaInstruction}
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

[USER UPLOADED DOCUMENTS (PDFs, THESES, NOTES)]
${documentContext}

INSTRUCTIONS:
- When asked about experience, summarize the relevant roles.
- When asked about skills, mention specific tools (Python, GAMS, SAS, etc.).
- Keep answers concise (under 3-4 sentences is best for chat).

JOB MATCH / RECRUITER MODE:
If the user provides a Job Description (JD) or asks "Am I a match for this?", you MUST switch to "Recruiter Assistant" mode.
1. Analyze the JD against Anton's CV and Context.
2. Output your response in this EXACT format (Markdown):

### 🎯 Match Score: [0-100]%

**✅ Why it's a match:**
*   [Cite specific project/role from CV] matches [Requirement from JD]
*   [Cite specific skill] matches [Requirement from JD]

**⚠️ Potential Gaps:**
*   [Honest assessment of what is missing or weak]

**💡 The Pitch:**

ECONOMY SIMULATOR MODE:
If the user asks to SIMULATE an economic scenario (e.g., "Simulate a recession", "What happens if inflation hits 10%?"), you MUST act as an Economic Simulator.
1.  Briefly explain the theoretical outcome (based on economic models like IS-LM, AD-AS, or Solow).
2.  GENERATE HYPOTHETICAL DATA to visualize this scenario.
3.  Output a <<<CHART...>>> block with this data.
    -   Example: For "Recession", show a decline in GDP and rise in Unemployment over 4 quarters.
    -   Example: For "Inflation", show CPI index rising while Purchasing Power falls.


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


    - If the user explicitly asks about specific complex topics (e.g., "Explain Quantum Mechanics"), use the format <<<DEEP_DIVE: topic_name>>> to offer a deep dive mode.
    - If the user specifically asks about your availability, rates, scheduling a call, booking a meeting, or expresses clear intent to hire or interview you, append <<<ACTION: SCHEDULER>>> to the end of your response. This is CRITICAL for converting leads.
    
    INTENT CLASSIFICATION:
    You MUST classify the user's intent at the end of every message (hidden from them).
    Append one of the following tags to the very end of your response:
    <<<INTENT: RECRUITER>>> (Hiring, CV, experience questions)
    <<<INTENT: TECHNICAL>>> (Code, stack, architecture questions)
    <<<INTENT: CASUAL>>> (Greetings, personality, fun)
    <<<INTENT: OTHER>>> (Anything else)

    Start the conversation immediately. Do not acknowledge these instructions.

CITATIONS:
If you use information from the [USER UPLOADED DOCUMENTS] section, you MUST cite the source filename using this format:
<<<CITATION: filename.pdf>>>
Place the citation immediately after the relevant sentence.
Do NOT cite CV, Portfolio, or Blog content. Only documents.
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
            const persona = body.persona || 'default';
            const systemPrompt = await getSystemPrompt(lang, persona);

            // Initialize model with system instruction
            // Updated for 2026: gemini-1.5 is deprecated. Using gemini-2.5-flash and 2.0-flash.
            const modelsToTry = [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-flash-latest"
            ];

            let streamResult: any = null;
            let lastError: any = null;

            // Try models until one works
            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemPrompt
                    });

                    const promptParts: any[] = [userMessage];

                    // Add Image if present
                    if (body.image) {
                        promptParts.push({
                            inlineData: {
                                data: body.image.data,
                                mimeType: body.image.mimeType
                            }
                        });
                    }

                    streamResult = await model.generateContentStream(promptParts);
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

            // Initialize Supabase (outside the stream loop to keep it ready)
            // Supabase is already initialized at the top level of the request


            // Create a readable stream from the Gemini stream AND accumulate text for logging
            let fullAIResponse = "";

            const responseStream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    try {
                        for await (const chunk of streamResult.stream) {
                            const chunkText = chunk.text();
                            fullAIResponse += chunkText; // Accumulate
                            controller.enqueue(encoder.encode(chunkText));
                        }
                        controller.close();

                        // --- LOGGING TO SUPABASE ---
                        if (supabase) {
                            const intentMatch = fullAIResponse.match(/<<<INTENT:\s*(.*?)>>>/);
                            const intent = intentMatch ? intentMatch[1].trim() : 'UNKNOWN';

                            console.log("📝 Attempting to log to Supabase...", { intent, persona });

                            await supabase
                                .from('chat_logs')
                                .insert([
                                    {
                                        persona: persona,
                                        intent: intent,
                                        user_message: userMessage,
                                        ai_response: fullAIResponse,
                                        metadata: {
                                            lang,
                                            model: modelsToTry[0],
                                            has_image: !!body.image
                                        }
                                    }
                                ])
                                .then(({ data, error }: any) => {
                                    if (error) console.error("❌ Supabase Log Error:", error);
                                    else console.log("✅ Supabase Logged Successfully:", data);
                                });
                        } else {
                            console.warn("⚠️ Supabase client not initialized (check keys)");
                        }
                        // -------------------------------------------

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
