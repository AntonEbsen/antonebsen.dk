import { z } from 'zod';

/**
 * Request schemas for the two paid AI routes, with the bounds they lacked.
 *
 * Both schemas validated *shape* and nothing else. A caller could send hundreds of
 * thousands of uncached input tokens in one request — re-sent on every pass of the
 * tool loop — and the spend guard in budget.ts would count it as one message at the
 * measured typical cost. The ceiling that guard enforces is only as real as the
 * size of what it is counting.
 *
 * The numbers sit well above real use and well below what would matter to the bill:
 * the client keeps a HISTORY_WINDOW of ten turns, and a job posting pasted through
 * the PDF path on /ai-chat runs to a few thousand characters.
 */
export const CHAT_LIMITS = {
    /** Turns per request. The client window is 10; legacy callers get headroom. */
    messages: 24,
    /** Characters in one turn. */
    messageChars: 16_000,
    /** Characters across the whole conversation, ~8k tokens. */
    totalChars: 32_000,
    /** Base64 characters: ~5 MB decoded, the API's own per-image ceiling. */
    imageBase64Chars: 7_000_000,
    personaChars: 32,
} as const;

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(CHAT_LIMITS.messageChars),
});

export const ChatRequestSchema = z
    .object({
        messages: z.array(ChatMessageSchema).max(CHAT_LIMITS.messages).optional(),
        /** Legacy single-turn callers. */
        message: z.string().max(CHAT_LIMITS.messageChars).optional(),
        image: z
            .object({
                /** base64, no data: prefix */
                data: z.string().max(CHAT_LIMITS.imageBase64Chars),
                mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
            })
            .optional(),
        // Only the fields buildSystem reads. This was `z.record(z.any())`, and it goes
        // straight into the system prompt.
        context: z
            .object({
                type: z.enum(['project', 'general']).optional(),
                data: z
                    .object({
                        title: z.string().max(200).optional(),
                        simple: z.boolean().optional(),
                        critique: z.boolean().optional(),
                        codeSnippet: z
                            .object({
                                lang: z.string().max(40).optional(),
                                // buildSystem slices this to 4,000 for the prompt; the
                                // bound here is on what may travel, not what is used.
                                code: z.string().max(20_000).optional(),
                                title: z.string().max(200).optional(),
                            })
                            .nullable()
                            .optional(),
                    })
                    .optional(),
            })
            .optional(),
        // What the caller can render. A 'prose' surface — the command palette's compact
        // preview — is offered no client-rendered tools, so the model is never told a
        // chart was shown to someone who cannot see one.
        surface: z.enum(['chat', 'prose']).optional(),
        persona: z.string().max(CHAT_LIMITS.personaChars).optional(),
        lang: z.enum(['en', 'da', 'de']).optional(),
    })
    .refine(
        (body) =>
            (body.messages ?? []).reduce((n, m) => n + m.content.length, 0) + (body.message?.length ?? 0) <=
            CHAT_LIMITS.totalChars,
        { message: `The conversation exceeds ${CHAT_LIMITS.totalChars} characters.`, path: ['messages'] },
    );

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const TEXT_TO_SQL_LIMITS = {
    /** A question, not a document. */
    textChars: 2_000,
    /** The DataPlayground's column list; it is injected into the system prompt. */
    schemaChars: 4_000,
} as const;

export const TextToSqlSchema = z.object({
    text: z.string().trim().min(1).max(TEXT_TO_SQL_LIMITS.textChars),
    schema: z.string().max(TEXT_TO_SQL_LIMITS.schemaChars).optional(),
    lang: z.string().max(8).optional(),
});

export type TextToSqlRequest = z.infer<typeof TextToSqlSchema>;
