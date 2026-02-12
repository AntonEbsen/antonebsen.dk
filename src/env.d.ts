/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "*.json" {
    const value: any;
    export default value;
}

interface ImportMetaEnv {
    readonly SUPABASE_URL: string;
    readonly SUPABASE_ANON_KEY: string;
    readonly GEMINI_API_KEY: string;
    readonly UPSTASH_REDIS_REST_URL?: string;
    readonly UPSTASH_REDIS_REST_TOKEN?: string;
    readonly ADMIN_SECRET?: string;
    readonly CRON_SECRET?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
