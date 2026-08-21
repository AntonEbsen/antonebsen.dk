import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { checkRateLimit } from '../../lib/ratelimit';
import { GEN, CHAT_MODEL } from '../../lib/ai/model';
import { buildCorpus, type Lang } from '../../lib/ai/corpus';
import { toolsFor, isServerResolved, resolveCitations, type Surface } from '../../lib/ai/tools';
import { encodeEvent, NDJSON_CONTENT_TYPE, type ChatEvent } from '../../lib/ai/protocol';
import { createClient } from '../../lib/ai/client';
import { checkBudget } from '../../lib/ai/budget';

export const prerender = false;

const ChatSchema = z.object({
   messages: z.array(z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string()
   })).optional(),
   message: z.string().optional(), // Legacy single-turn callers
   image: z.object({
      data: z.string(), // base64, no data: prefix
      mimeType: z.string()
   }).optional(),
   context: z.object({
      type: z.enum(['project', 'general']).optional(),
      data: z.record(z.any()).optional()
   }).optional(),
   // What the caller can render. A 'prose' surface — the command palette's compact
   // preview — is offered no client-rendered tools, so the model is never told a
   // chart was shown to someone who cannot see one.
   surface: z.enum(['chat', 'prose']).optional(),
   persona: z.string().optional(),
   lang: z.enum(['en', 'da', 'de']).optional()
});

const LANGUAGE_NAMES: Record<string, string> = {
   da: 'Danish (Dansk)',
   de: 'German (Deutsch)',
   en: 'English',
};

const PERSONA_NOTES: Record<string, string> = {
   recruiter: 'This visitor is likely hiring. Lead with what Anton can do: analytical skills, teaching experience, and the tools he actually uses.',
   tech: "This visitor is technical. Go deeper on the stack — Python, data science, econometric modelling — and don't over-explain the basics.",
   eli5: 'Explain simply, as you would to someone with no economics background. Short sentences, no jargon without unpacking it.',
};

/** How many times the model may call tools before we stop looping. */
const MAX_TOOL_TURNS = 4;

/**
 * The code sample the project page shows, as prompt text.
 *
 * ProjectDetailPage collects it and ProjectBot sends it on every request; nothing here
 * ever read it, so the Reviewer was asked to review code it had not been given. Capped
 * because it travels uncached on every turn, unlike the corpus above it.
 */
function codeSnippetBlock(snippet: unknown): string {
   const s = snippet as { lang?: string; code?: string; title?: string } | undefined;
   if (!s?.code || typeof s.code !== 'string') return '';
   const code = s.code.slice(0, 4000);
   return [
      '',
      `The page shows this code sample${s.title ? ` (${s.title})` : ''}:`,
      '```' + (s.lang || ''),
      code,
      '```',
   ].join(String.fromCharCode(10));
}

/**
 * What the turn actually cost, in tokens.
 *
 * Nothing measured this before, so the spend guard's conversion from requests to money
 * rested entirely on an assumption: that the ~18k-token corpus is read from cache at
 * roughly a tenth of the input price. If it is not, a request costs about ten times
 * what the ceiling assumes and the guard cannot tell, because it counts requests.
 *
 * `cached` on the second and later requests within the TTL is the number that decides
 * whether the ceiling needs recalibrating. `new` being large every time means the cache
 * is being written and never read — the failure this is here to make visible.
 */
function logUsage(usage: Anthropic.Usage | null | undefined): void {
   if (!usage) return;
   const cached = usage.cache_read_input_tokens ?? 0;
   const written = usage.cache_creation_input_tokens ?? 0;
   const hit = cached + written > 0 ? Math.round((cached / (cached + written)) * 100) : 0;
   console.log(
      `[chat] tokens in=${usage.input_tokens} cached=${cached} new=${written} ` +
      `out=${usage.output_tokens} cache-hit=${hit}%`,
   );
}

function buildSystem(lang: Lang, persona: string, context: any): Anthropic.TextBlockParam[] {
   const corpus = buildCorpus(lang).text;

   const instructions = context?.type === 'project'
      ? [
         `You are 'The Reviewer', giving feedback on the project "${context?.data?.title || 'Unknown'}".`,
         'Be concise, professional, and constructively critical — say what is weak, not only what is good.',
         context?.data?.simple ? 'Explain simply, as to a beginner.' : '',
         context?.data?.critique ? 'Be blunt about weaknesses.' : 'Stay constructive.',
         '',
         // The facts above are the whole corpus, not just this project. Saying so is the
         // difference between a generic review bot and one that can place a piece of
         // work in the context of everything else its author has written.
         "The facts above cover all of Anton's work, not only this project. Where it",
         'relates to his other projects or writing — the same method, a contradicting',
         'result, an argument he made elsewhere — say so and cite it with citeSources.',
         // Transmitted on every request from ProjectDetailPage and, until now, dropped
         // here: the client collected a code sample the model was never shown.
         codeSnippetBlock(context?.data?.codeSnippet),
      ].filter(Boolean).join('\n')
      : [
         "You are the assistant on Anton's personal site. You answer questions about Anton.",
         '',
         `Answer in ${LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.en}, whatever language the question is asked in.`,
         'Everything you say about Anton must come from the facts above. If something is not there,',
         "say you don't know rather than filling the gap — do not infer roles, employers or dates.",
         'Keep answers short and readable: a few sentences unless the question genuinely needs more.',
         '',
         'When you draw on a specific source, call citeSources with its id. Never write an',
         'id such as (influence:orwell) into your reply — those are for the tool only, and',
         'a visitor reading them sees database keys instead of a link.',
         '',
         "You have Anton's essays in full, not just their summaries, so you can do something",
         'a general assistant cannot: compare his arguments against each other. When a question',
         'touches two pieces of his writing, say how they relate — where they reinforce each',
         'other and where they sit in tension — and cite both.',
         '',
         'The facts above include how he thinks, not only what he has done: the thinkers who',
         'shaped him, his family, the books and places that mattered, and his own essay on',
         'adversity. Draw on those when someone asks about him as a person rather than as a CV.',
         '',
         'Use the other tools when they serve the visitor better than prose would.',
         PERSONA_NOTES[persona] || '',
      ].filter(Boolean).join('\n');

   // The corpus is identical for every request in a language and goes first, so it
   // forms a stable prefix. The cache breakpoint sits at the end of it: everything
   // above is billed at cache-read rates on repeat requests, which is the difference
   // between ~10k tokens at full price and at a tenth of it. The per-request tail
   // (persona, project title) is deliberately in a second block, after the marker.
   return [
      // The 5-minute default, kept deliberately after measuring the alternative.
      //
      // The reasoning for 1h was that a five-minute window cannot survive between two
      // visitors to a quiet site. That was the wrong frame: the cache earns its keep
      // *within* a conversation, whose messages are seconds apart, and 5m already
      // covers that. Between isolated conversations no TTL helps — you pay the write
      // either way, and a 1h write costs 2x base against 1.25x for 5m.
      //
      // Measured on the real corpus (21,626 tokens): one isolated question costs
      // $0.0623 at 5m and $0.0947 at 1h — 52% more for a case that does not benefit.
      { type: 'text', text: corpus, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: instructions },
   ];
}

/** Compose the conversation, attaching an uploaded image to the final user turn. */
function buildMessages(
   history: { role: string; content: string }[],
   image?: { data: string; mimeType: string },
): Anthropic.MessageParam[] {
   const messages: Anthropic.MessageParam[] = history
      // A 'system' role is not valid mid-conversation on Sonnet 5; drop stray ones.
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

   const last = messages[messages.length - 1];
   if (image && last?.role === 'user' && typeof last.content === 'string') {
      last.content = [
         {
            type: 'image',
            source: {
               type: 'base64',
               media_type: image.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
               data: image.data,
            },
         },
         { type: 'text', text: last.content },
      ];
   }
   return messages;
}

export const POST = async ({ request }: { request: Request }) => {
   let body: z.infer<typeof ChatSchema>;

   try {
      const parsed = ChatSchema.safeParse(await request.json());
      if (!parsed.success) {
         return new Response(JSON.stringify({ message: 'Invalid Input', errors: parsed.error.format() }), { status: 400 });
      }
      body = parsed.data;
   } catch {
      return new Response(JSON.stringify({ message: 'Invalid Input' }), { status: 400 });
   }

   const anthropic = createClient();
   if (!anthropic) {
      console.error('CRITICAL: ANTHROPIC_API_KEY is missing');
      return new Response(JSON.stringify({ message: 'Server Configuration Error: Missing API Key' }), { status: 500 });
   }

   const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
   if (!(await checkRateLimit('chat', clientIP)).success) {
      return new Response(JSON.stringify({ message: 'Too many requests. Please wait a bit.' }), { status: 429 });
   }

   // Checked before any model call, because this is the one that costs money.
   const budget = await checkBudget(clientIP);
   if (!budget.allowed) {
      return new Response(JSON.stringify({ message: budget.message }), { status: 429 });
   }

   const lang = (body.lang || 'en') as Lang;
   const tools = toolsFor((body.surface ?? 'chat') as Surface);
   const persona = body.persona || 'default';
   const history = body.messages?.length
      ? body.messages
      : body.message ? [{ role: 'user', content: body.message }] : [];

   if (!history.length) {
      return new Response(JSON.stringify({ message: 'Invalid Input' }), { status: 400 });
   }

   const system = buildSystem(lang, persona, body.context);
   const messages = buildMessages(history, body.image);

   const encoder = new TextEncoder();
   const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
         const send = (event: ChatEvent) => controller.enqueue(encoder.encode(encodeEvent(event)));

         try {
            // The model may call tools, read the results, and keep going. Each pass
            // streams whatever prose it produces, then either finishes or hands back
            // tool calls for us to answer.
            for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
               const messageStream = anthropic.messages.stream({
                  ...GEN,
                  system,
                  tools,
                  messages,
               });

               messageStream.on('text', (delta) => send({ type: 'text', text: delta }));

               const message = await messageStream.finalMessage();
               logUsage(message.usage);

               if (message.stop_reason !== 'tool_use') {
                  // Sonnet 5 can decline a request outright; that arrives as a normal
                  // response, not an error, so it needs saying rather than showing blank.
                  if (message.stop_reason === 'refusal') {
                     send({ type: 'error', message: "I can't help with that one." });
                  }
                  break;
               }

               const toolUses = message.content.filter(
                  (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
               );

               messages.push({ role: 'assistant', content: message.content });

               const results: Anthropic.ToolResultBlockParam[] = [];
               for (const call of toolUses) {
                  if (isServerResolved(call.name)) {
                     const { sources } = resolveCitations(call.input, lang);
                     if (sources.length) send({ type: 'citations', sources });
                     results.push({
                        type: 'tool_result',
                        tool_use_id: call.id,
                        content: sources.length
                           ? `Cited ${sources.length} source(s).`
                           : 'None of those ids exist. Cite only ids from the facts, or omit citations.',
                     });
                  } else {
                     // Rendered by the browser. The schema already validated the input,
                     // so forwarding it is safe; the client still treats it as data.
                     send({ type: 'tool', name: call.name, input: call.input });
                     results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Shown to the visitor.' });
                  }
               }

               // A `tool_use` stop with nothing to answer would push a user message
               // whose content array is empty, and the API rejects that with a 400
               // ("user messages must have non-empty content"). By then the response
               // headers are long sent, so the visitor gets a generic failure instead
               // of the answer the model was part-way through giving. There is nothing
               // to send back, so the turn is simply over.
               if (!results.length) {
                  console.warn(
                     `[chat] tool_use stop with no tool calls; blocks: ${
                        message.content.map((b) => b.type).join(', ') || '(none)'
                     }`,
                  );
                  break;
               }

               messages.push({ role: 'user', content: results });
            }

            send({ type: 'done' });
         } catch (error: any) {
            // Logged compactly: the SDK's error objects nest a full copy of the
            // request and response per retry, which buries everything around them.
            const status = error?.status ?? error?.error?.status;
            const detail = String(error?.message ?? error).split('\n')[0];
            console.error(`Chat stream failed${status ? ` (HTTP ${status})` : ''}: ${detail}`);

            // Headers are long gone by now, so the failure has to travel as an event.
            send({
               type: 'error',
               message: status === 429
                  ? 'The assistant is busy right now. Try again in a moment.'
                  : 'The assistant is unavailable right now.',
            });
         } finally {
            controller.close();
         }
      },
   });

   return new Response(stream, {
      headers: {
         'Content-Type': NDJSON_CONTENT_TYPE,
         'Cache-Control': 'no-store',
         'X-Chat-Model': CHAT_MODEL,
      },
   });
};
