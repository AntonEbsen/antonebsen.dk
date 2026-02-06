import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

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

      // 2. Determine Mode (Legacy vs New)
      const isNewWidget = body.messages && Array.isArray(body.messages);

      // 3. Construct Model & Prompts
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
            model: google('gemini-1.5-flash'),
            messages: messages,
            system: systemPrompt,
         });

         // Use 'as any' to bypass linter error if toDataStreamResponse is not in the type def
         return (result as any).toDataStreamResponse();

      } else {
         // === LEGACY QUANTUM AI ===
         const { message, lang = 'da', persona = 'default' } = body;

         const systemPrompts: Record<string, string> = {
            default: "You are Anton's AI Assistant. Professional, humble, yet confident. Answer in the requested language.",
            recruiter: "You are an Agent for Anton. Sell his skills to the recruiter.",
            tech: "You are a Senior Engineer. Discuss architecture and code.",
            eli5: "Explain like the user is 5 years old."
         };

         const result = streamText({
            model: google('gemini-1.5-flash'),
            messages: [{ role: 'user', content: message }],
            system: systemPrompts[persona] || systemPrompts.default
         });

         // Legacy widget expects raw text stream
         return result.toTextStreamResponse();
      }

   } catch (error: any) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ message: "AI Error: " + error.message }), { status: 500 });
   }
};
