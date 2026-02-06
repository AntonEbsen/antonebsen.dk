import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { supabase } from '@/lib/supabase';
import { ragContent } from '@/lib/generated-rag';

export const prerender = false;

export const POST = async (req: Request) => {
   try {
      const body = await req.json();

      // CASE 1: New AI Widget (ProjectBot) - Uses Vercel AI SDK protocol
      if (body.messages && Array.isArray(body.messages)) {
         const { messages, context } = body;

         const systemPrompt = `
         You are "The Reviewer", an expert academic defense bot for Anton Ebsen's portfolio.
         Your goal is to answer questions about the specific project titled "${context?.title}".
         
         Current Mode: ${context?.simple ? "ELI5 (Explain Like I'm 5)" : "Academic"}
         
         Context from RAG:
         ---
         ${ragContent}
         ---
         
         Instructions:
         1. Be helpful, concise, and professional.
         2. If asked for code, explain the logic.
         3. If asked for data, use SQL format.
         `;

         // Log to Supabase (Safe)
         if (supabase) {
            try {
               await supabase.from('chat_logs').insert([
                  {
                     project: context?.title || 'Unknown',
                     user_message: messages[messages.length - 1].content,
                     bot_mode: context?.simple ? 'ELI5' : 'Standard',
                     timestamp: new Date().toISOString()
                  }
               ]);
            } catch (e) {
               console.error("Supabase Error (Non-fatal):", e);
            }
         }

         const result = await streamText({
            model: google('gemini-2.0-flash'),
            system: systemPrompt,
            messages,
         });

         // @ts-ignore
         return result.toDataStreamResponse();
      }

      // CASE 2: Legacy Quantum AI (ChatWidget.astro) - Uses raw text stream
      else if (body.message) {
         const { message, lang, persona } = body;

         let systemPrompt = `You are Anton's AI Assistant. You are helpful, professional, and concise. Language: ${lang || 'en'}.`;

         // Minimal Persona Logic for Legacy Bot
         if (persona === 'recruiter') systemPrompt += " Focus on professional achievements, ROI, and reliability. Be formal.";
         if (persona === 'tech') systemPrompt += " Focus on technical stack, architecture patterns (RAG, Astro, React), and code quality.";
         if (persona === 'eli5') systemPrompt += " Explain complex topics simply, like you are talking to a 5-year-old.";

         const result = await streamText({
            model: google('gemini-2.0-flash'),
            system: systemPrompt,
            messages: [{ role: 'user', content: message }], // Wrap single message
         });

         // Return raw text stream for vanilla JS frontend
         return new Response(result.textStream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
         });
      }

      return new Response(JSON.stringify({ error: "Invalid Request Format" }), { status: 400 });

   } catch (error: any) {
      console.error("API ROUTE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
   }
};
