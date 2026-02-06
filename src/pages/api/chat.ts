import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { supabase } from '@/lib/supabase';
import { ragContent } from '@/lib/generated-rag';

export const POST = async (req: Request) => {
   try {
      const { messages, context } = await req.json();

      const systemPrompt = `
      You are "The Reviewer", an expert academic defense bot for Anton Ebsen's portfolio.
      Your goal is to answer questions about the specific project titled "${context.title}".
      
      Current Mode: ${context.simple ? "ELI5 (Explain Like I'm 5)" : "Academic"}
      
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
                  project: context.title,
                  user_message: messages[messages.length - 1].content,
                  bot_mode: context.simple ? 'ELI5' : 'Standard',
                  timestamp: new Date().toISOString()
               }
            ]);
         } catch (e) {
            console.error("Supabase Error (Non-fatal):", e);
         }
      }

      const result = streamText({
         model: google('gemini-2.0-flash'),
         system: systemPrompt,
         messages,
      });

      return result.toDataStreamResponse();

   } catch (error: any) {
      console.error("API ROUTE ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
   }
};
