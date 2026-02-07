import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';

// Static RAG Data
// @ts-ignore
import cvEn from '../../content/cv/en.json';
// @ts-ignore
import skillsEn from '../../content/skills/en.json';

// @ts-ignore
import cvDa from '../../content/cv/da.json';
// @ts-ignore
import skillsDa from '../../content/skills/da.json';

export const prerender = false;

function getBioContext(lang: string) {
   // Select content based on language
   const cv = lang === 'da' ? cvDa : cvEn;
   const skills = lang === 'da' ? skillsDa : skillsEn;

   const experiences = cv.experience.map((e: any) => `- ${e.title} at ${e.organization} (${e.period}): ${e.description.join('. ')}`).join('\n');
   const education = cv.education.map((e: any) => `- ${e.degree} at ${e.institution}`).join('\n');
   const proSkills = skills.professional.map((s: any) => s.name).join(', ');
   const codeSkills = skills.programming.map((s: any) => `${s.name} (${s.level})`).join(', ');
   const projects = cv.projects.map((p: any) => `- ${p.title}: ${p.description}`).join('\n');

   return `
FACTS ABOUT ANTON (SOURCE OF TRUTH):
[Education]
${education}

[Work Experience]
${experiences}

[Technical Skills]
- Programming: ${codeSkills}
- Professional: ${proSkills}

[Projects]
${projects}

[Languages]
${skills.languages.map((l: any) => `- ${l.name}: ${l.level}`).join('\n')}
`;
}

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
         // === UNIFIED GLOBAL ASSISTANT ===
         const { messages, context, persona = 'default', lang = 'en' } = body;
         const bio = getBioContext(lang);

         let systemPrompt = "";

         if (context?.type === 'project') {
            // --- PROJECT REVIEWER MODE ---
            systemPrompt = `
             You are 'The Reviewer', reviewing the project "${context.data?.title || 'Unknown'}".
             ${bio}
             
             Style: Concise, professional, slightly cynical but constructive.
             Modes: ${context.data?.simple ? 'ELI5' : 'Normal'}, ${context.data?.critique ? 'Ruthless' : 'Constructive'}.
             ${context.data?.codeSnippet ? 'Has Code Context.' : ''}
             `;
         } else {
            // --- GENERAL ASSISTANT MODE ---
            const baseInstruction = `You are Anton's AI Assistant. You answer questions about Anton using ONLY the facts above.
             CRITICAL RULES:
             1. ALWAYS answer in the language: ${lang === 'da' ? 'Danish (Dansk)' : 'English'}.
             2. Never hallucinate roles not listed in facts (e.g. Anton is NOT an engineering manager).
             3. If the user asks about something not in the facts, politely say you don't know or relate it to his Economics background.
             4. Keep it brief and professional.`;

            const prompts: Record<string, string> = {
               default: `${bio}\n${baseInstruction}`,
               recruiter: `${bio}\n${baseInstruction}\nFocus on his employability: Analytical skills, teaching experience, and technical tools.`,
               tech: `${bio}\n${baseInstruction}\nFocus on his technical stack: Python, Data Science, and Economic Modeling details.`,
               eli5: `${bio}\n${baseInstruction}\nExplain simply like I am 5 years old.`
            };

            systemPrompt = prompts[persona] || prompts.default;
         }

         const result = streamText({
            model: google('gemini-2.0-flash'),
            messages: messages,
            system: systemPrompt,
         });

         // Switch to Text Stream for maximum compatibility with client useChat
         return result.toTextStreamResponse();

      } else {
         // === LEGACY FALLBACK (Deprecate soon) ===
         const { message, lang = 'da', persona = 'default' } = body;
         const bio = getBioContext(lang);
         // ... (Keep existing legacy logic for now)
         const baseInstruction = `You are Anton's AI Assistant. You answer questions about Anton using ONLY the facts above.`;
         const systemPrompts: Record<string, string> = {
            default: `${bio}\n${baseInstruction}`,
            recruiter: `${bio}\n${baseInstruction}\nFocus on his employability.`,
            tech: `${bio}\n${baseInstruction}\nFocus on his technical stack.`,
            eli5: `${bio}\n${baseInstruction}\nExplain simply.`
         };

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
