import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '../../lib/ai/client';
import { checkRateLimit } from '../../lib/ratelimit';
import { CHAT_MODEL } from '../../lib/ai/model';
import { checkReadOnly } from '../../lib/ai/sql-guard';
import { checkBudget } from '../../lib/ai/budget';

export const prerender = false;

export const POST = async ({ request }: { request: Request }) => {
    try {
        const { text, schema } = await request.json();

        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        // Shares the chat budget: same provider, same cost profile.
        if (!(await checkRateLimit('chat', clientIP)).success) {
            return new Response(JSON.stringify({ message: 'Too many requests. Please wait a bit.' }), { status: 429 });
        }

        // Shares the site's spend ceiling: same provider, same bill.
        const budget = await checkBudget(clientIP);
        if (!budget.allowed) {
            return new Response(JSON.stringify({ message: budget.message }), { status: 429 });
        }

        const anthropic = createClient();
        if (!anthropic) {
            return new Response(JSON.stringify({ message: 'Server Configuration Error' }), { status: 500 });
        }

        if (typeof text !== 'string' || !text.trim()) {
            return new Response(JSON.stringify({ message: 'Invalid Input' }), { status: 400 });
        }

        const message = await anthropic.messages.create({
            model: CHAT_MODEL,
            max_tokens: 1024,
            // A question with one right answer: no thinking, minimal effort. There is
            // deliberately no temperature — Sonnet 5 rejects non-default sampling params.
            thinking: { type: 'disabled' },
            output_config: { effort: 'low' },
            system: `You translate questions into DuckDB SQL.

Schema:
${schema || 'Table: main_data (columns unknown; assume a financial time series with columns like date, vix, sp500)'}

Rules:
- Return only the query. No prose, no markdown fences, no explanation.
- The table is named main_data.
- Use DuckDB syntax, including its date functions.
- SELECT only. Never DROP, DELETE, INSERT, UPDATE or ALTER.
- Add LIMIT 50 unless the question asks for a specific number of rows.`,
            messages: [{ role: 'user', content: text }],
        });

        const raw = message.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('')
            // Strip fences if the model adds them anyway.
            .replace(/```sql/gi, '')
            .replace(/```/g, '')
            .trim();

        // The prompt says SELECT only; this is what enforces it. A model can be talked
        // into writing anything — by the question, or by text in a document it read —
        // so the statement is checked before it is handed to a database engine.
        const check = checkReadOnly(raw);
        if (!check.ok) {
            console.warn('Text-to-SQL: rejected a non-read-only statement.');
            return new Response(JSON.stringify({ message: check.reason }), { status: 422 });
        }

        return new Response(JSON.stringify({ sql: check.sql }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        // Logged, not returned — this route is reachable anonymously and provider
        // errors quote the request, schema and prompt back.
        const status = error?.status;
        console.error(`Text-to-SQL failed${status ? ` (HTTP ${status})` : ''}: ${String(error?.message ?? error).split('\n')[0]}`);
        return new Response(JSON.stringify({ message: 'Could not generate a query.' }), { status: 500 });
    }
};
