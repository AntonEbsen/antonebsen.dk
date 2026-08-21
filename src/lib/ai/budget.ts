import { redis, redisEnabled } from '../ratelimit';

/**
 * A spend ceiling for the paid AI routes.
 *
 * This is a different kind of control from the rate limiter next door, and the
 * difference matters. `checkRateLimit` protects the *experience* — it stops one visitor
 * flooding the widget — and it deliberately fails **open**, because a Redis blip should
 * not take the chat down.
 *
 * This protects the *bill*. The previous provider was on a free tier, so the worst case
 * was the chat going quiet; Anthropic is pay-as-you-go, so the worst case is now money.
 * A guard that fails open offers no protection at precisely the moment it is needed, so
 * this one fails **closed** — see `checkBudget` for the exact rule.
 */

export interface BudgetCaps {
    /** The real ceiling. */
    month: number;
    /** Stops a single bad day consuming the whole month. */
    day: number;
    /** Stops one visitor consuming everyone else's share. */
    perIpDay: number;
}

/**
 * The budget, in money, and what a message actually costs.
 *
 * These used to be bare request counts justified by "~$0.011 per message with the
 * corpus cached". That figure was never measured and was wrong by about 5.6x, for two
 * reasons the guard could not see:
 *
 *  - **One visitor message is two model calls.** The tool loop runs again after a
 *    citeSources call, and nearly every grounded answer makes one.
 *  - **The cache write dominates an isolated question.** The corpus is 21,626 tokens;
 *    writing it costs 1.25x input rate, reading it 0.1x. A conversation amortises that
 *    over its messages, but a visitor who asks one question and leaves pays the write
 *    on its own.
 *
 * Measured against the live API on 2026-08-20, at Sonnet 5 intro pricing: an isolated
 * question is **$0.062**, and a five-message conversation is **$0.117** — about
 * $0.023 a message once the write is shared. The isolated figure is the one to size
 * against, because it is the pessimistic case and the one a bot loop would produce.
 *
 * At $0.062, the old cap of 450 would have allowed roughly **$28** of spend before
 * refusing anything. Deriving the count from the budget keeps that honest: change
 * MONTHLY_BUDGET_USD and the caps follow.
 */
export const MONTHLY_BUDGET_USD = 5;

/**
 * The pieces a message is actually billed as, so the cap is arithmetic rather than a
 * remembered number. Re-derive after a corpus change by reading one `[chat] tokens`
 * line from the server log.
 *
 * Measured against the live API on 2026-08-20 at Sonnet 5 intro pricing.
 */
const PRICING = {
    /** Tokens in the cached system prefix. The log calls this `cached` / `new`. */
    corpusTokens: 21_626,
    /** Per-token input rate. Sonnet 5 intro; $3/1M after 2026-08-31. */
    inputRate: 2 / 1e6,
    outputRate: 10 / 1e6,
    /** Writing the cache costs 1.25x input at the 5m TTL; reading it costs 0.1x. */
    cacheWriteMultiplier: 1.25,
    cacheReadMultiplier: 0.1,
    /** Uncached per-call input: the conversation window and the tool schemas. */
    perCallInputTokens: 650,
    perCallOutputTokens: 150,
} as const;

/**
 * The pessimistic cost of one visitor message.
 *
 * Two things the old flat $0.011 missed, and which this makes explicit:
 *
 *  - **A message is several model calls.** The tool loop runs again after each tool
 *    call, and nearly every grounded answer makes one. Sizing against MAX_TOOL_TURNS
 *    rather than the two typically observed is deliberate — the cap exists for the bad
 *    case, and a tool-heavy message is about 26% dearer than a typical one.
 *  - **The first call writes the cache.** That write is $0.054 of the total on its own.
 *    A conversation amortises it; a visitor who asks one question and leaves does not.
 */
const MAX_TOOL_TURNS = 4;

function worstCaseMessageCost(): number {
    const { corpusTokens, inputRate, outputRate } = PRICING;
    const write = corpusTokens * inputRate * PRICING.cacheWriteMultiplier;
    const read = corpusTokens * inputRate * PRICING.cacheReadMultiplier;
    const perCall = PRICING.perCallInputTokens * inputRate + PRICING.perCallOutputTokens * outputRate;

    // First call writes the prefix; every later call in the loop reads it.
    return write + perCall + (MAX_TOOL_TURNS - 1) * (read + perCall);
}

export const COST_PER_MESSAGE_USD = worstCaseMessageCost();

const monthly = Math.max(1, Math.floor(MONTHLY_BUDGET_USD / COST_PER_MESSAGE_USD));

export const DEFAULT_CAPS: BudgetCaps = {
    month: monthly,
    // A quarter of the month in one day is enough for a genuine burst of interest and
    // still leaves three quarters if that day turns out to be a scraper.
    day: Math.max(1, Math.floor(monthly / 4)),
    // One visitor should not be able to spend everyone else's share in an afternoon.
    perIpDay: Math.max(1, Math.floor(monthly / 10)),
};

export type BudgetScope = 'month' | 'day' | 'ip' | 'unavailable';

export type BudgetVerdict =
    | { allowed: true }
    | { allowed: false; scope: BudgetScope; message: string };

export interface BudgetCounts {
    month: number;
    day: number;
    perIp: number;
}

/**
 * The decision, given counts that have already been incremented.
 *
 * Split out from the Redis call so it can be tested without a network or a fake client.
 * Counts are post-increment, so the current request is included: a cap of 1 permits
 * exactly one request.
 */
export function evaluateBudget(counts: BudgetCounts, caps: BudgetCaps = DEFAULT_CAPS): BudgetVerdict {
    if (counts.month > caps.month) {
        return {
            allowed: false,
            scope: 'month',
            message: 'The assistant has reached its budget for this month. It will be back next month.',
        };
    }
    if (counts.day > caps.day) {
        return {
            allowed: false,
            scope: 'day',
            message: 'The assistant has reached its budget for today. Try again tomorrow.',
        };
    }
    if (counts.perIp > caps.perIpDay) {
        return {
            allowed: false,
            scope: 'ip',
            message: "You've reached today's limit for the assistant. Try again tomorrow.",
        };
    }
    return { allowed: true };
}

/** `2026-08` — the month bucket key suffix. */
export function monthKey(now = new Date()): string {
    return now.toISOString().slice(0, 7);
}

/** `2026-08-15` — the day bucket key suffix. */
export function dayKey(now = new Date()): string {
    return now.toISOString().slice(0, 10);
}

// A little longer than the window each key covers, so a bucket never expires while
// it is still the current one.
const MONTH_TTL_SECONDS = 32 * 24 * 60 * 60;
const DAY_TTL_SECONDS = 25 * 60 * 60;

/**
 * Increment the counters and decide.
 *
 * Incrementing before deciding is deliberate: it is atomic, so concurrent requests
 * cannot both slip past the cap, and a client that keeps hammering after being refused
 * only drives its own counter further up — it never gets cheaper to retry.
 *
 * Fail direction:
 *  - Redis **not configured** → allow. That is local dev and CI, where there is no
 *    shared counter to consult and no production spend to protect.
 *  - Redis configured but the call **throws** → refuse. Something is wrong with the one
 *    thing standing between a bot loop and the bill, so this is the case to be
 *    pessimistic about. `validate-env.mjs` requires the Upstash keys in production, so
 *    a deploy cannot reach the "not configured" branch by accident.
 */
export async function checkBudget(
    ip: string,
    caps: BudgetCaps = DEFAULT_CAPS,
    now = new Date(),
): Promise<BudgetVerdict> {
    if (!redisEnabled || !redis) return { allowed: true };

    const month = `budget:month:${monthKey(now)}`;
    const day = `budget:day:${dayKey(now)}`;
    const perIp = `budget:ip:${ip}:${dayKey(now)}`;

    try {
        const pipeline = redis.pipeline();
        pipeline.incr(month);
        pipeline.expire(month, MONTH_TTL_SECONDS);
        pipeline.incr(day);
        pipeline.expire(day, DAY_TTL_SECONDS);
        pipeline.incr(perIp);
        pipeline.expire(perIp, DAY_TTL_SECONDS);

        const results = await pipeline.exec();

        return evaluateBudget(
            {
                month: Number(results[0]),
                day: Number(results[2]),
                perIp: Number(results[4]),
            },
            caps,
        );
    } catch (err) {
        console.error('Budget check failed; refusing the request to protect spend:', err);
        return {
            allowed: false,
            scope: 'unavailable',
            message: 'The assistant is unavailable right now.',
        };
    }
}
