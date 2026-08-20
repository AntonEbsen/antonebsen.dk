/**
 * Golden-set eval for the chat assistant.
 *
 *   npm run dev          (in one shell)
 *   npm run eval         (in another)
 *
 * Deliberately NOT part of `npm run test`: that runs on every push via the husky
 * hook, and these cases each cost a real API call. Run this by hand after touching
 * the prompt or the corpus, and on a schedule if you want drift caught early.
 *
 * COST: one full run is 21 requests — 19 cases, two of which take two turns. The Anthropic API is pay-as-you-go with no
 * free tier, so a run costs real money — roughly a cent or two at Sonnet 5 prices
 * with the corpus cached. Use EVAL_ONLY to run a subset:
 *
 *   EVAL_ONLY=language npm run eval     # only cases whose name matches /language/
 *
 * Cases assert on facts, never on phrasing. An LLM will word the same correct answer
 * a hundred ways; the things worth failing a build over are that it got the facts
 * right, stayed in the requested language, and declined what it does not know.
 *
 * Exits non-zero if any case fails, so it can gate a nightly job.
 *
 * Set EVAL_STATUS_OUT to also write the result as JSON, which is what the nightly
 * workflow commits back and /ai-project renders:
 *
 *   EVAL_STATUS_OUT=src/data/ai-eval-status.json npm run eval
 */

import fs from 'node:fs';
import path from 'node:path';
import { readChatModel, readModelLabel } from './read-model.mjs';

const NEWLINE = String.fromCharCode(10);

const BASE = process.env.CHAT_BASE_URL || 'http://localhost:4321';

/** Every case: ask `q` in `lang`, then require all `must` and no `mustNot`. */
const CASES = [
    {
        name: 'education — names the university',
        q: 'Where did Anton study?',
        lang: 'en',
        must: [/copenhagen|københav/i],
        mustNot: [/oxford|harvard|cambridge/i],
    },
    {
        name: 'education — names the degree',
        q: 'What degree is Anton doing?',
        lang: 'en',
        must: [/econom/i],
    },
    {
        name: 'role — does not promote him',
        q: 'Is Anton an engineering manager? Answer honestly.',
        lang: 'en',
        // Rule 2 of the system prompt exists because this was a real failure mode.
        mustNot: [/yes,? (he|anton) is an engineering manager/i],
    },
    {
        name: 'role — describes the teaching job',
        q: 'What does Anton teach?',
        lang: 'en',
        must: [/excel|vba/i],
    },
    {
        name: 'skills — names real tools',
        q: 'Which programming languages does Anton use?',
        lang: 'en',
        must: [/python/i],
    },
    {
        name: 'writing — knows the ECB post',
        q: 'What has Anton written about the Eurozone?',
        lang: 'en',
        must: [/eurozone|ecb|monetary union/i],
    },
    {
        name: 'writing — answers from the body, not the description',
        q: 'In his trilemma post, what does Anton say the Mundell-Fleming trilemma states?',
        lang: 'en',
        // Only reachable if full post bodies are in context.
        must: [/two of the (following )?three|capital|exchange rate/i],
    },
    {
        name: 'writing — knows the welfare-state argument',
        q: 'What are the two competing theories in Anton\'s welfare state post?',
        lang: 'en',
        must: [/globali[sz]|welfare/i],
    },
    {
        name: 'out of corpus — declines instead of inventing',
        q: "What is Anton's shoe size?",
        lang: 'en',
        mustNot: [/\bsize (8|9|10|11|4[0-9])\b/i],
        must: [/do(es)? ?n'?o?t have|do(es)? ?n'?o?t know|not (listed|mentioned|specified|available)|no information|ikke/i],
    },
    {
        name: 'out of corpus — no invented employer',
        q: 'Does Anton work at Goldman Sachs?',
        lang: 'en',
        mustNot: [/yes,? (he|anton) (works|has worked) at goldman/i],
    },
    {
        name: 'language — Danish in, Danish out',
        q: 'Hvor har Anton studeret?',
        lang: 'da',
        must: [/københav|danmark|handelsgymnasi/i],
        mustNot: [/\bhe studied\b/i],
    },
    {
        name: 'language — German in, German out',
        q: 'Wo hat Anton studiert?',
        lang: 'de',
        // A German answer will use at least one of these; an English one will not.
        must: [/\b(hat|und|der|die|das|studierte|Universität)\b/],
        mustNot: [/\bhe (studied|is|has)\b/i],
    },
    {
        name: 'cross-reference — relates two of his own posts',
        q: 'Anton wrote about the Mundell-Fleming trilemma and about the ECB. How do those two arguments relate?',
        lang: 'en',
        // Only answerable with both post bodies in context. A generic assistant, or
        // one fed descriptions, cannot connect them.
        must: [/trilemma|capital|exchange rate/i, /ecb|eurozone|monetary union/i],
    },
    {
        name: 'the person — names the thinkers who shaped him',
        q: 'Which thinkers shaped how Anton thinks?',
        lang: 'en',
        must: [/dostoevsky|keynes|orwell|tolstoy|piketty/i],
        // Source ids are for the citation tool, never for the visible answer.
        mustNot: [/influence:|blog:|cv:experience/],
    },
    {
        name: 'the person — answers from the adversity essay',
        q: 'What has Anton written about adversity and doubt?',
        lang: 'en',
        must: [/doubt|adversit|purpose|struggl/i],
    },
    {
        // The case that would have caught the whole memory defect. The second question
        // is meaningless on its own; answering it requires the first turn.
        name: 'memory — a follow-up that needs the previous turn',
        turns: [
            'Name one economist who shaped how Anton thinks. Just the one.',
            'And what about the other one?',
        ],
        lang: 'en',
        must: [/keynes|piketty|dostoevsky|orwell|tolstoy/i],
        // A model with no history asks what "the other one" refers to.
        mustNot: [/which (other|one)|could you clarify|not sure what you (mean|are referring)/i],
    },
    {
        // The quiz is a round trip through the conversation, so it is only testable
        // now that history travels. It was inert for as long as it was not.
        name: 'quiz — asks, scores, and asks again',
        turns: [
            'Give me a quiz about monetary policy. Ask the first question.',
            // Verbatim the shape chat-ui.ts sends when an option is clicked. It has to
            // name the option: tool calls are not written back into the transcript, so
            // on this turn the model cannot see the question it asked — only what the
            // visitor says they picked. Phrasing this as a vague "was I right?" makes
            // the model apologise for a question it cannot find, which is what the
            // first draft of this case did, and it was the case that was wrong.
            'I answered "Raise the interest rate" — correct. Next question please.',
        ],
        lang: 'en',
        check: ({ tools }) => {
            const asked = tools.filter((t) => t.name === 'askQuizQuestion');
            const problems = [];
            if (!asked.length) {
                problems.push('no askQuizQuestion tool call — the quiz never started');
                return problems;
            }
            for (const q of asked) {
                const opts = q.input?.options;
                if (!Array.isArray(opts) || opts.length < 2 || opts.length > 4) {
                    problems.push(`options must be 2-4, got ${JSON.stringify(opts)}`);
                }
                const i = q.input?.correctIndex;
                if (!Number.isInteger(i) || i < 0 || i >= (opts?.length ?? 0)) {
                    problems.push(`correctIndex ${i} is out of range`);
                }
            }
            // Two turns, so a working quiz asks twice: one on request, one after the
            // answer comes back. Fewer means the round trip broke, which is what
            // happened for as long as no history was sent at all.
            if (asked.length < 2) problems.push(`expected a question on each turn, got ${asked.length}`);
            return problems;
        },
    },
    {
        // Asserts the citation *resolved*, not that the prose mentioned a source.
        // Model text never becomes a link, so a real URL here is the whole guarantee.
        name: 'citations — resolve to real pages on this site',
        q: 'What has Anton written about the Eurozone? Cite your sources.',
        lang: 'en',
        check: ({ citations }) => {
            if (!citations.length) return ['no citations event — nothing was cited'];
            return citations.flatMap((c) => {
                const problems = [];
                if (!c.title) problems.push(`source ${c.id} has no title`);
                if (typeof c.url !== 'string' || !c.url.startsWith('/')) {
                    problems.push(`source ${c.id} url is not site-relative: ${c.url}`);
                }
                return problems;
            });
        },
    },
    {
        name: 'persona — recruiter stays on the facts',
        q: 'Why should I hire Anton?',
        lang: 'en',
        persona: 'recruiter',
        must: [/econom|analy|teach|excel|python/i],
        mustNot: [/engineering manager/i],
    },
];

/**
 * One turn against the live endpoint.
 *
 * Takes the conversation so far and returns the prose plus everything the clients
 * would have rendered. It used to post `{ message }` — the endpoint's legacy
 * single-turn field — long after every client had moved to `messages[]`, so the
 * nightly drift check was exercising a path nothing used. A memory regression would
 * have left it green.
 *
 * Tool and citation events used to be discarded here too, which meant a case could
 * assert what the model *said* but never what it *did*: no way to check that a
 * citation resolved, or that a quiz question was actually asked.
 */
async function ask({ turns, lang, persona, context }) {
    const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: turns, lang, persona: persona ?? 'default', context }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);

    // The body is NDJSON, one typed event per line.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let out = '';
    let failure = '';
    const tools = [];
    const citations = [];

    const consume = (line) => {
        if (!line.trim()) return;
        try {
            const event = JSON.parse(line);
            if (event.type === 'text') out += event.text;
            else if (event.type === 'tool') tools.push(event);
            else if (event.type === 'citations') citations.push(...(event.sources ?? []));
            else if (event.type === 'error') failure = event.message;
        } catch {
            // Truncated frame; the rest of the stream is still usable.
        }
    };

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(NEWLINE);
        buffer = lines.pop() ?? '';
        lines.forEach(consume);
    }
    consume(buffer);

    if (failure) throw new Error(failure);
    return { answer: out.trim(), tools, citations };
}

/**
 * Run a case's turns in order, feeding each answer back as the assistant's reply.
 *
 * A case with one question behaves exactly as before. A case with several is the only
 * way to test anything conversational — which, until the clients started sending
 * history, was untestable by construction.
 */
async function runCase(c) {
    const script = c.turns ?? [c.q];
    const turns = [];
    let last = { answer: '', tools: [], citations: [] };
    // Accumulated across the whole case, not just the final turn: a quiz asks one
    // question per turn, so a check that only saw the last one could never tell a
    // working round trip from a broken one.
    const tools = [];
    const citations = [];

    for (const [i, prompt] of script.entries()) {
        if (i > 0) await sleep(GAP_MS);
        turns.push({ role: 'user', content: prompt });
        last = await ask({ turns, lang: c.lang, persona: c.persona, context: c.context });
        tools.push(...last.tools);
        citations.push(...last.citations);
        // Only the prose goes back. Tool calls are not part of the stored transcript,
        // so the model cannot see a question it asked — which is why the client's
        // answer message names the option the visitor picked.
        turns.push({ role: 'assistant', content: last.answer });
    }
    return { answer: last.answer, tools, citations };
}

/**
 * Gap between cases, to stay clear of burst rate limits. The chat route streams, so
 * a provider failure arrives after the 200 headers — as an `error` event, or as a
 * body with no text at all. Both are caught below rather than passing silently.
 */
const GAP_MS = Number(process.env.EVAL_GAP_MS ?? 1500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Subset filter, so a targeted check does not spend the whole daily budget.
const only = process.env.EVAL_ONLY;
const selected = only ? CASES.filter((c) => new RegExp(only, 'i').test(c.name)) : CASES;

if (!selected.length) {
    console.error(`No cases match EVAL_ONLY=${only}`);
    process.exit(1);
}
console.log(`${selected.length} case(s), ~${Math.round((selected.length * GAP_MS) / 1000)}s\n`);

const results = [];

for (const [i, c] of selected.entries()) {
    if (i > 0) await sleep(GAP_MS);
    try {
        const result = await runCase(c);
        const { answer, tools, citations } = result;
        const failures = [];
        // Checked before the assertions: a case with only `mustNot` rules passes
        // vacuously on an empty answer, which would quietly report a dead endpoint
        // as a healthy one.
        if (!answer) {
            failures.push('empty answer — the stream closed without producing any text (check the server log)');
        } else {
            for (const re of c.must ?? []) {
                if (!re.test(answer)) failures.push(`expected to match ${re}`);
            }
            for (const re of c.mustNot ?? []) {
                if (re.test(answer)) failures.push(`expected NOT to match ${re}`);
            }
        }
        // `check` sees what the clients would have rendered, not just the prose, so a
        // case can assert that the model *did* something rather than said it would.
        if (c.check) {
            for (const problem of c.check(result) ?? []) failures.push(problem);
        }
        results.push({ name: c.name, failures, answer });
        process.stdout.write(failures.length ? '✗' : '·');
    } catch (err) {
        results.push({ name: c.name, failures: [err.message], answer: '' });
        process.stdout.write('!');
    }
}

console.log('\n');

const failed = results.filter((r) => r.failures.length);
for (const r of failed) {
    console.log(`✗ ${r.name}`);
    for (const f of r.failures) console.log(`    ${f}`);
    console.log(`    answer: ${r.answer.replace(/\s+/g, ' ').slice(0, 240)}`);
    console.log();
}

console.log(`${results.length - failed.length}/${results.length} passed`);

/**
 * Publish the result, so the site can state it rather than claim it.
 *
 * `scope` is recorded because the two scheduled runs are not the same test: six nights
 * a week this is a three-case smoke subset, and only Sunday runs the full set. Writing
 * just "3/3 passing" would read as a much weaker result than the weekly one and a much
 * stronger one than a three-case sample deserves, so the page needs to know which it
 * is looking at.
 *
 * Failures are written too. A status file that only ever records success is decoration;
 * the point of publishing it is that it can say something the author would rather it
 * did not.
 */
const statusOut = process.env.EVAL_STATUS_OUT;
if (statusOut) {
    const status = {
        passed: results.length - failed.length,
        total: results.length,
        scope: only ? 'smoke' : 'full',
        // The full set's size, so a smoke run can still say what it is a subset of.
        suiteTotal: CASES.length,
        model: readChatModel(),
        modelLabel: readModelLabel(),
        // Date only: the time of day is noise, and a full timestamp would rewrite the
        // committed file every night even when nothing about the result changed.
        checkedAt: new Date().toISOString().slice(0, 10),
    };
    fs.mkdirSync(path.dirname(path.resolve(statusOut)), { recursive: true });
    fs.writeFileSync(path.resolve(statusOut), JSON.stringify(status, null, 2) + '\n', 'utf8');
    console.log(`wrote ${statusOut}`);
}

if (failed.length) process.exitCode = 1;
