import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const prerender = false;

export const POST = async ({ request }: { request: Request }) => {
    try {
        const { text, schema } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ message: "Server Configuration Error" }), { status: 500 });
        }

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const systemPrompt = `
      You are a SQL Expert for DuckDB.
      Your goal is to convert natural language questions into a VALID READ-ONLY SQL query.
      
      Schema Context:
      ${schema || 'Table: main_data (columns unknown, assume standard financial time series like date, vix, sp500)'}

      Rules:
      1. Return ONLY the raw SQL. No markdown, no explanations.
      2. The table name is 'main_data'.
      3. Use DuckDB dialect (e.g., date functions like year(date), avg(), etc.).
      4. RESTRICTION: Only SELECT statements allowed. No DROP, DELETE, INSERT, UPDATE.
      5. Limit results to 50 unless specified.
    `;

        const { text: sql } = await generateText({
            model: google('gemini-2.0-flash'),
            messages: [{ role: 'user', content: text }],
            system: systemPrompt,
        });

        // Strip markdown if present
        const cleanSql = sql.replace(/```sql/g, '').replace(/```/g, '').trim();

        return new Response(JSON.stringify({ sql: cleanSql }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("Text-to-SQL Error:", error);
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }
};
