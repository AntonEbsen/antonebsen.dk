import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Allow bypassing in development if credentials are missing
const enabled = import.meta.env.UPSTASH_REDIS_REST_URL && import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const redis = enabled ? new Redis({
    url: import.meta.env.UPSTASH_REDIS_REST_URL,
    token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
}) : null;

export const ratelimits = {
    chat: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
        analytics: true,
        prefix: '@upstash/ratelimit/chat',
    }) : null,
    guestbook: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 requests per minute
        analytics: true,
        prefix: '@upstash/ratelimit/guestbook',
    }) : null,
};

export type RateLimitType = keyof typeof ratelimits;

export async function checkRateLimit(type: RateLimitType, identifier: string) {
    if (!enabled || !ratelimits[type]) {
        // Open gate if not configured (e.g. dev)
        return { success: true, remaining: 999 };
    }

    try {
        const result = await ratelimits[type]!.limit(identifier);
        return result;
    } catch (err) {
        console.error('Rate limit error:', err);
        // Fail open if Redis is down, or fail closed? Fail open is usually safer for UX unless under attack.
        return { success: true, remaining: 10 };
    }
}
