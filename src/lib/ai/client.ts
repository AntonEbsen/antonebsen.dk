import Anthropic from '@anthropic-ai/sdk';

/**
 * Reads the Anthropic key from both places it can live, and builds the client.
 *
 * The two sources are not interchangeable, which is easy to get wrong:
 *
 *  - `import.meta.env` is what Astro populates from a local `.env` file. This is the
 *    only one that works in `npm run dev`.
 *  - `process.env` is what a real environment variable looks like — how Vercel
 *    injects it in production, and how a shell export looks locally.
 *
 * Reading only `process.env` appears to work on a machine that happens to have the
 * key exported, and then fails for everyone else with `.env` — which is exactly how
 * this route shipped broken once already.
 */
export function getApiKey(): string | undefined {
    return import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
}

/** Build a client, or return null when no key is configured. */
export function createClient(): Anthropic | null {
    const apiKey = getApiKey();
    return apiKey ? new Anthropic({ apiKey }) : null;
}
