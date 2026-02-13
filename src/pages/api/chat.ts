import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import { checkRateLimit } from '../../lib/ratelimit';
import { z } from 'zod';
import { getCollection } from 'astro:content'; // Added for Blog Awareness

const ChatSchema = z.object({
   messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
   })).optional(),
   message: z.string().optional(), // Legacy
   // Vision Support: Accept base64 image
   image: z.object({
      data: z.string(), // base64
      mimeType: z.string()
   }).optional(),
   context: z.object({
      type: z.enum(['project', 'general']).optional(),
      data: z.record(z.any()).optional()
   }).optional(),
   persona: z.string().optional(),
   lang: z.enum(['en', 'da', 'de']).optional()
});

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

async function getBioContext(lang: string) {
   // Select content based on language
   const cv = lang === 'da' ? cvDa : cvEn;
   const skills = lang === 'da' ? skillsDa : skillsEn;

   const experiences = cv.experience.map((e: any) => `- ${e.title} at ${e.organization} (${e.period}): ${e.description.join('. ')}`).join('\n');
   const education = cv.education.map((e: any) => `- ${e.degree} at ${e.institution}`).join('\n');
   const proSkills = skills.professional.map((s: any) => s.name).join(', ');
   const codeSkills = skills.programming.map((s: any) => `${s.name} (${s.level})`).join(', ');
   const projects = cv.projects.map((p: any) => `- ${p.title}: ${p.description}`).join('\n');

   // --- BLOG CONTEXT INJECTION ---
   // Fetch all blog posts to give the AI "awareness" of written content
   let blogContext = "";
   try {
      const allPosts = await getCollection('blog');
      const posts = allPosts.map(p => {
         const title = lang === 'da' ? (p.data.title_da || p.data.title) : p.data.title;
         const brief = lang === 'da' ? (p.data.brief_da || []) : (p.data.brief || []);
         const description = lang === 'da' ? (p.data.description_da || p.data.description) : p.data.description;
         return `- "${title}" (${p.data.category}): ${description}. ${brief.join(' ')}`;
      }).join('\n');

      blogContext = `
[Authored Content / Blog Posts]
Antons has written the following articles. Use this to recommend reading or summarize his thoughts:
${posts}
`;
   } catch (e) {
      console.error("Failed to load blog context", e);
   }

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

${blogContext}
`;
}

// Fix: Destructure 'request' from the Astro APIContext
// Previous error "req.json is not a function" happened because the first arg is the context object, not the Request itself.
export const POST = async ({ request }: { request: Request }) => {
   try {
      const rawBody = await request.json();
      const parseResult = ChatSchema.safeParse(rawBody);

      if (!parseResult.success) {
         return new Response(JSON.stringify({ message: "Invalid Input", errors: parseResult.error.format() }), { status: 400 });
      }

      const body = parseResult.data;

      // 1. Validate Environment
      if (!process.env.GEMINI_API_KEY) {
         console.error("CRITICAL: GEMINI_API_KEY is missing");
         return new Response(JSON.stringify({ message: "Server Configuration Error: Missing API Key" }), { status: 500 });
      }

      // 1b. Rate Limit
      const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
      const limitResult = await checkRateLimit('chat', clientIP);
      if (!limitResult.success) {
         return new Response(JSON.stringify({ message: "Too many requests. Please wait a bit." }), { status: 429 });
      }

      // 2. Initialize Provider with Explicit Key
      const google = createGoogleGenerativeAI({
         apiKey: process.env.GEMINI_API_KEY
      });

      // 3. Normalize Input (Support Legacy Widget)
      let messages = body.messages;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
         if (body.message) {
            messages = [{ role: 'user', content: body.message }];
         } else {
            messages = [];
         }
      }

      // 4. Unified Logic (Always Stream)
      const { context, persona = 'default', lang = 'en', image } = body;
      const bio = await getBioContext(lang || 'en');

      let systemPrompt = "";

      // --- TOOL INSTRUCTIONS ---
      const toolInstructions = `
[UI CAPABILITIES - USE THESE TOOLS PROACTIVELY]
You have access to the following UI tools. Trigger them by outputting the specific syntax below.

1. SHOW A CHART:
   If the user asks for a visualization/graph/chart of data (like skills, experience timeline, or project stats), output this JSON block:
   <<<CHART
   {
     "type": "bar", // 'bar', 'line', 'pie', 'doughnut', 'radar'
     "data": {
       "labels": ["Python", "JavaScript", "Economics", "Data Science"],
       "datasets": [{ 
          "label": "Proficiency", 
          "data": [9, 8, 10, 9], 
          "backgroundColor": ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)", "rgba(255, 206, 86, 0.6)", "rgba(75, 192, 192, 0.6)"] 
       }]
     },
     "options": { "responsive": true, "indexAxis": "y" }
   }
   CHART>>>

2. NAVIGATE TO PAGE:
   If the user asks to go to a specific page or if a page is highly relevant (e.g. "Show me the blog", "Go to CV"), output:
   <<<NAVIGATE: /blog >>>
   Valid paths: /, /blog, /portfolio, /cv, /about, /contact

3. SUGGEST ACTIONS:
   To suggest follow-up questions or actions, output:
   <<<SUGGESTIONS: ["See Skills Chart", "Read User Guide", "Email Anton"] >>>

4. UNLOCK ACHIEVEMENT:
   If the user answers a quiz correctly or demonstrates knowledge, unlock a badge:
   <<<UNLOCK: "economist" >>>
   IDs: 'explorer', 'scholar', 'economist', 'recruiter', 'quiz_novice', 'easter_egg'

5. START QUIZ:
   To start a new quiz about a topic (like Taylor Rules):
   <<<QUIZ_START: { "topic": "Taylor Rules" } >>>
`;

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
          4. Keep it brief and professional.
          ${toolInstructions}`;

         const prompts: Record<string, string> = {
            default: `${bio}\n${baseInstruction}`,
            recruiter: `${bio}\n${baseInstruction}\nFocus on his employability: Analytical skills, teaching experience, and technical tools.`,
            tech: `${bio}\n${baseInstruction}\nFocus on his technical stack: Python, Data Science, and Economic Modeling details.`,
            eli5: `${bio}\n${baseInstruction}\nExplain simply like I am 5 years old.`
         };

         systemPrompt = prompts[persona] || prompts.default;
      }

      // --- VISION SUPPORT ---
      // If an image is provided, we must construct the "user" message as a multi-modal content array.
      // We only attach the image to the LAST user message.
      let finalMessages: any[] = messages || [];

      if (image && finalMessages.length > 0) {
         const lastMsg = finalMessages[finalMessages.length - 1];
         // Only attach if last message is from user
         if (lastMsg.role === 'user') {
            // Replace string content with array content for vision
            lastMsg.content = [
               { type: 'text', text: lastMsg.content },
               { type: 'image', image: image.data } // @ai-sdk/google expects 'image' with base64
            ];
         }
      }

      const result = streamText({
         model: google('gemini-2.0-flash'),
         messages: finalMessages,
         system: systemPrompt,
      });

      // Switch to Text Stream for maximum compatibility with client useChat
      return result.toTextStreamResponse();

   } catch (error: any) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ message: "AI Error: " + error.message }), { status: 500 });
   }
};
