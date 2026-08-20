import type Anthropic from '@anthropic-ai/sdk';
import { NAV_ALLOWLIST } from './safe-html';
import { resolveSources, type Lang, type Source } from './corpus';

/**
 * The assistant's UI capabilities, as real tools.
 *
 * These replace a delimiter DSL — the model was taught to emit `<<<CHART {…} CHART>>>`
 * and `<<<NAVIGATE: /blog >>>` in its prose, and each client regex'd them back out.
 * That arrangement had three problems this file fixes:
 *
 *  - Half-written tags flashed on screen mid-stream, because a partial `<<<CHART {`
 *    matches no closing delimiter and fell through to the visible text.
 *  - Malformed JSON inside a tag silently rendered nothing.
 *  - The navigation allowlist lived in the prompt as a sentence, which is a request,
 *    not a control. Here it is `enum` in a schema the API validates before the call
 *    ever reaches the client.
 *
 * Tools split two ways. Most are **client-rendered**: the server has nothing to do
 * but forward the call to the browser, so their result is a bare acknowledgement.
 * `citeSources` is **server-resolved** — it turns ids into real titles and URLs from
 * the same corpus that built the prompt, so the client renders links built from
 * trusted data rather than from model text.
 */

export type ToolName =
    | 'showChart'
    | 'navigateTo'
    | 'suggestFollowUps'
    | 'askQuizQuestion'
    | 'recordLedgerEntry'
    | 'citeSources';

/** Ledger entries the assistant may award. The rest are earned by doing the thing. */
export const AWARDABLE_LEDGER_ENTRIES = ['economist', 'quiz_novice'] as const;

export const TOOLS: Anthropic.Tool[] = [
    {
        name: 'showChart',
        description:
            'Render a chart in the chat. Use when the visitor asks to visualise or compare ' +
            'something quantitative about Anton — skill levels, a timeline, project counts. ' +
            'Prefer a chart over a long list of numbers in prose.',
        input_schema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['bar', 'line', 'pie', 'doughnut', 'radar'],
                    description: 'Chart style. Use bar for comparisons, line for anything over time.',
                },
                title: { type: 'string', description: 'Short caption shown above the chart.' },
                labels: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Category labels, one per data point.',
                },
                data: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Values, same length and order as labels.',
                },
                datasetLabel: { type: 'string', description: 'Legend label for the series.' },
            },
            required: ['type', 'labels', 'data'],
            additionalProperties: false,
        },
    },
    {
        name: 'navigateTo',
        description:
            'Take the visitor to a page on this site. Use when they ask to go somewhere, or ' +
            'when a page answers their question better than a paragraph would.',
        input_schema: {
            type: 'object',
            properties: {
                // The schema *is* the allowlist. An off-list path is rejected by the API
                // before the client sees it, rather than being asked for politely in prose.
                path: {
                    type: 'string',
                    enum: [...NAV_ALLOWLIST],
                    description: 'Destination path. Match the language the visitor is reading in.',
                },
            },
            required: ['path'],
            additionalProperties: false,
        },
    },
    {
        name: 'suggestFollowUps',
        description:
            'Offer up to three follow-up questions as clickable chips. Use at the end of an ' +
            'answer when there is an obvious next thing to ask.',
        input_schema: {
            type: 'object',
            properties: {
                suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    maxItems: 3,
                    description: 'Short questions, phrased as the visitor would ask them.',
                },
            },
            required: ['suggestions'],
            additionalProperties: false,
        },
    },
    {
        name: 'askQuizQuestion',
        description:
            'Ask the visitor one multiple-choice question and show it as clickable options. ' +
            'Use when they ask to be quizzed or tested on something Anton has written about — ' +
            'monetary policy, the trilemma, the welfare state. Draw the question from the facts ' +
            'above so the answer is actually in his work. Ask one question at a time and wait ' +
            'for the answer; the visitor sees whether they were right immediately, so react to ' +
            'their answer and move on rather than repeating the explanation.',
        input_schema: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'The question, in the visitor\'s language.' },
                options: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 2,
                    maxItems: 4,
                    description: 'Two to four answers. Wrong ones should be plausible, not filler.',
                },
                correctIndex: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 3,
                    description: 'Zero-based index of the correct option.',
                },
                explanation: {
                    type: 'string',
                    description: 'One or two sentences on why that answer is right.',
                },
            },
            required: ['question', 'options', 'correctIndex', 'explanation'],
            additionalProperties: false,
        },
    },
    {
        name: 'recordLedgerEntry',
        description:
            'Record an entry in the visitor\'s ledger. Only these two are awarded by ' +
            'conversation; every other entry is earned by doing the thing it describes ' +
            '(visiting pages, reading a post, printing the CV, the Konami code).',
        input_schema: {
            type: 'object',
            properties: {
                entry: {
                    type: 'string',
                    enum: [...AWARDABLE_LEDGER_ENTRIES],
                    description:
                        "'economist' when they engage with monetary policy or Taylor rules; " +
                        "'quiz_novice' when they finish a quiz.",
                },
            },
            required: ['entry'],
            additionalProperties: false,
        },
    },
    {
        name: 'citeSources',
        description:
            'Cite the sources behind your answer. Call this whenever you draw on a specific ' +
            'blog post, video, project or CV entry, using the parenthesised ids from the facts ' +
            'above (for example blog:ecb-part-1). Cite what you actually used — the ids are ' +
            'resolved to real links, and anything unrecognised is dropped.',
        input_schema: {
            type: 'object',
            properties: {
                ids: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Source ids exactly as they appear in the facts, e.g. cv:experience:0.',
                },
            },
            required: ['ids'],
            additionalProperties: false,
        },
    },
];

/** Tools the server resolves itself. Everything else is forwarded to the browser. */
const SERVER_RESOLVED = new Set<ToolName>(['citeSources']);

/**
 * What a given surface can actually render.
 *
 * The tool loop answers every client-rendered call with "Shown to the visitor." — and
 * did so regardless of whether the client could show anything. The command palette
 * consumes prose only, deliberately and correctly for a one-line preview, so a chart it
 * "showed" was never drawn and the model carried on believing otherwise. The Reviewer
 * had the same bug until it learned to render them.
 *
 * Telling the model about a tool the surface cannot render is the root of that, so a
 * prose surface is simply not offered one. citeSources survives because the server
 * resolves it: no client rendering is involved.
 */
export type Surface = 'chat' | 'prose';

export function toolsFor(surface: Surface = 'chat'): Anthropic.Tool[] {
    if (surface !== 'prose') return TOOLS;
    return TOOLS.filter((t) => isServerResolved(t.name));
}

export function isServerResolved(name: string): boolean {
    return SERVER_RESOLVED.has(name as ToolName);
}

export interface ResolvedCitations {
    sources: Source[];
}

/**
 * Turn the ids the model cited into links, dropping any it invented.
 *
 * The resolved list is what the client renders, so a hallucinated id produces no
 * link rather than a plausible-looking 404 — and no model-authored string ever
 * becomes an href.
 */
export function resolveCitations(input: unknown, lang: Lang): ResolvedCitations {
    const ids = Array.isArray((input as { ids?: unknown })?.ids)
        ? ((input as { ids: unknown[] }).ids.filter((i) => typeof i === 'string') as string[])
        : [];
    return { sources: resolveSources(ids, lang) };
}
