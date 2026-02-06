import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { ragContent } from '@/lib/generated-rag';

export const POST = async (req: Request) => {
    const { messages, context } = await req.json();

    const systemPrompt = `
    You are "The Reviewer", an expert academic defense bot for Anton Ebsen's portfolio.
    Your goal is to answer questions about the specific project titled "${context.title}".
    
    Here is the relevant context from the project documentation (RAG):
    ---
    ${ragContent}
    ---
    
    Tone: Professional, academic, yet approachable.
    Constraint: Only answer based on the provided context. If the answer is not in the context, say "I don't have that specific detail in my memory banks, but I can tell you about [related topic in context]."
  `;

    const result = streamText({
        model: google('gemini-2.0-flash'),
        system: systemPrompt,
        messages,
    });

    return result.toDataStreamResponse();
};
