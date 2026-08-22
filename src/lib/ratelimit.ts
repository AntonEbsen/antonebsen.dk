import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * The REST credentials, under either of the two names they arrive as.
 *
 * Upstash's own dashboard calls them UPSTASH_REDIS_REST_URL/_TOKEN. Vercel's
 * Marketplace integration provisions the same database but injects KV_REST_API_URL
 * and KV_REST_API_TOKEN, and that is what a deploy actually gets — so reading only
 * the first pair means the limiter and the spend guard silently see no Redis on the
 * one platform this site runs on, and both fall through to their "not configured"
 * branch. Accepting both is what makes the integration work without copying secrets
 * to second names, which would go stale the moment the integration rotates them.
 *
 * KV_URL and REDIS_URL are also injected, but they are redis:// TCP URLs — the wrong
 * shape for the REST client, so they are deliberately not consulted.
 */
export const redisUrl =
    import.meta.env.UPSTASH_REDIS_REST_URL || import.meta.env.KV_REST_API_URL;
export const redisToken =
    import.meta.env.UPSTASH_REDIS_REST_TOKEN || import.meta.env.KV_REST_API_TOKEN;

// Allow bypassing in development if credentials are missing
export const redisEnabled = Boolean(redisUrl && redisToken);
const enabled = redisEnabled;

export const redis = enabled ? new Redis({
    url: redisUrl,
    token: redisToken,
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
    contact: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, '120 s'), // 3 messages per 2 minutes
        analytics: true,
        prefix: '@upstash/ratelimit/contact',
    }) : null,
    subscribe: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(3, '120 s'), // 3 attempts per 2 minutes
        analytics: true,
        prefix: '@upstash/ratelimit/subscribe',
    }) : null,
    login: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, '900 s'), // 5 attempts per 15 minutes
        analytics: true,
        prefix: '@upstash/ratelimit/login',
    }) : null,
    write: enabled ? new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(20, '60 s'), // 20 mutations per minute
        analytics: true,
        prefix: '@upstash/ratelimit/write',
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
