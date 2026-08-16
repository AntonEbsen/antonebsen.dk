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
 * Sized for roughly $5/month at Claude Sonnet 5 prices with the corpus cached
 * (~$0.011 per message). The monthly bucket is what makes this usable: a flat
 * 15-per-day would let one curious visitor exhaust an entire day in a single
 * conversation, while a month-long bucket lets a quiet week fund a busy afternoon.
 */
export const DEFAULT_CAPS: BudgetCaps = {
    month: 450,
    day: 100,
    perIpDay: 30,
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
