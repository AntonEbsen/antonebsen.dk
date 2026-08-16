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
 * COST: one full run is 16 requests. The Anthropic API is pay-as-you-go with no
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
        name: 'persona — recruiter stays on the facts',
        q: 'Why should I hire Anton?',
        lang: 'en',
        persona: 'recruiter',
        must: [/econom|analy|teach|excel|python/i],
        mustNot: [/engineering manager/i],
    },
];

async function ask({ q, lang, persona }) {
    const res = await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, lang, persona: persona ?? 'default' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);

    // The body is NDJSON, one typed event per line. Assertions look at prose only:
    // tool calls and citations are their own events and never pollute the text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let out = '';
    let failure = '';

    const consume = (line) => {
        if (!line.trim()) return;
        try {
            const event = JSON.parse(line);
            if (event.type === 'text') out += event.text;
            else if (event.type === 'error') failure = event.message;
        } catch {
            // Truncated frame; the rest of the stream is still usable.
        }
    };

    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        lines.forEach(consume);
    }
    consume(buffer);

    if (failure) throw new Error(failure);
    return out.trim();
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
        const answer = await ask(c);
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
