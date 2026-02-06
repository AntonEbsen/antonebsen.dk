import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';

export const prerender = false;

// Fix: Destructure 'request' from the Astro APIContext
// Previous error "req.json is not a function" happened because the first arg is the context object, not the Request itself.
export const POST = async ({ request }: { request: Request }) => {
   try {
      const body = await request.json();

      // 1. Validate Environment
      if (!process.env.GEMINI_API_KEY) {
         console.error("CRITICAL: GEMINI_API_KEY is missing");
         return new Response(JSON.stringify({ message: "Server Configuration Error: Missing API Key" }), { status: 500 });
      }

      // 2. Initialize Provider with Explicit Key
      const google = createGoogleGenerativeAI({
         apiKey: process.env.GEMINI_API_KEY
      });

      // 3. Determine Mode (Legacy vs New)
      const isNewWidget = body.messages && Array.isArray(body.messages);

      // 4. Construct Model & Prompts
      if (isNewWidget) {
         // === NEW PROJECT BOT ===
         const { messages, context } = body;
         const systemPrompt = `
         You are 'The Reviewer', reviewing the project "${context?.title || 'Unknown'}".
         Style: Concise, professional, slightly cynical but constructive.
         Modes: ${context?.simple ? 'ELI5' : 'Normal'}, ${context?.critique ? 'Ruthless' : 'Constructive'}.
         ${context?.codeSnippet ? 'Has Code Context.' : ''}
         `;

         const result = streamText({
            model: google('gemini-2.0-flash'),
            messages: messages,
            system: systemPrompt,
         });

         // Use 'as any' to bypass linter error if toDataStreamResponse is not in the type def
         return (result as any).toDataStreamResponse();

      } else {
         // === LEGACY QUANTUM AI ===
         const { message, lang = 'da', persona = 'default' } = body;

         const bio = `
FACTS ABOUT ANTON:
- Education: MSc in Economics (cand.polit) at Uni Copenhagen (2021-Present).
- Work: Student Lecturer at Djøf (Excel/VBA).
- Skills: Python, Excel/VBA, SAS, GAMS, Econometrics, Macroeconomics.
- Role: Economist & Data Analyst (NOT a Software Engineer manager).
- Projects: Global Financial Cycle (SVAR), ECB Taylor Rules.
         `;

         const baseInstruction = `You are Anton's AI Assistant. Use the facts above.
CRITICAL RULES:
1. ALWAYS answer in the language: ${lang === 'da' ? 'Danish (Dansk)' : 'English'}.
2. Never hallucinate roles not listed in facts (e.g. do not say he is an engineering manager).
3. Keep it brief and professional.`;

         const systemPrompts: Record<string, string> = {
            default: `${bio}\n${baseInstruction}`,
            recruiter: `${bio}\n${baseInstruction}\nFocus on his employability: Analytical skills, teaching experience, and technical tools.`,
            tech: `${bio}\n${baseInstruction}\nFocus on his technical stack: Python, Data Science, and Economic Modeling details.`,
            eli5: `${bio}\n${baseInstruction}\nExplain simply like I am 5 years old.`
         };

         // Legacy widget: Use simpler generateText (Non-streaming) to guarantee response
         // This avoids all stream protocol mismatch issues.
         const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            messages: [{ role: 'user', content: message }],
            system: systemPrompts[persona] || systemPrompts.default
         });

         return new Response(JSON.stringify({ message: text }), {
            headers: { 'Content-Type': 'application/json' }
         });
      }

   } catch (error: any) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ message: "AI Error: " + error.message }), { status: 500 });
   }
};
