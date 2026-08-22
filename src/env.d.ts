/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "*.json" {
    const value: any;
    export default value;
}

interface ImportMetaEnv {
    readonly SUPABASE_URL: string;
    readonly SUPABASE_ANON_KEY: string;
    /** Anthropic API key. Powers /api/chat and /api/text-to-sql. */
    readonly ANTHROPIC_API_KEY: string;
    /**
     * Upstash REST credentials, under both names they can arrive as: Upstash's own
     * dashboard uses UPSTASH_REDIS_REST_*, while Vercel's Marketplace integration
     * injects KV_REST_API_*. src/lib/ratelimit.ts reads either.
     */
    readonly UPSTASH_REDIS_REST_URL?: string;
    readonly UPSTASH_REDIS_REST_TOKEN?: string;
    readonly KV_REST_API_URL?: string;
    readonly KV_REST_API_TOKEN?: string;
    readonly ADMIN_SECRET?: string;
    readonly CRON_SECRET?: string;
    /** Admin dashboard password. Required — login fails closed without it. */
    readonly ADMIN_PASSWORD: string;
    /** HMAC key for admin session cookies. Required — see src/lib/session.ts. */
    readonly SESSION_SECRET: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
