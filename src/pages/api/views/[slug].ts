import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

// Initialize Redis if credentials exist
const redis = (import.meta.env.UPSTASH_REDIS_REST_URL && import.meta.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: import.meta.env.UPSTASH_REDIS_REST_URL,
        token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

export const GET: APIRoute = async ({ params }) => {
    const { slug } = params;

    if (!slug) {
        return new Response(JSON.stringify({ error: 'Slug is required' }), { status: 400 });
    }

    if (!redis) {
        // Fallback if Redis is not configured (e.g. local dev without env)
        return new Response(JSON.stringify({ views: 0 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Get current count
        const views = await redis.get<number>(`pageviews:blog:${slug}`) || 0;

        return new Response(JSON.stringify({ views }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=60, stale-while-revalidate=30' // Cache for 1 min
            }
        });
    } catch (error) {
        console.error('Redis error:', error);
        return new Response(JSON.stringify({ views: 0 }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ params }) => {
    const { slug } = params;

    if (!slug) return new Response(null, { status: 400 });
    if (!redis) return new Response(JSON.stringify({ views: 1 }), { status: 200 });

    try {
        // Increment count
        const views = await redis.incr(`pageviews:blog:${slug}`);

        return new Response(JSON.stringify({ views }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to increment' }), { status: 500 });
    }
};
