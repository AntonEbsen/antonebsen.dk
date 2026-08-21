import process from 'process';
import dotenv from 'dotenv';

// Load the same files Astro does, in the same precedence order (a real environment
// variable wins, then .env.local, then .env — dotenv never overwrites what is already
// set). Without this the check reads process.env only, so a local build warned that
// ANTHROPIC_API_KEY was missing while the site ran fine with it in .env. A warning
// that cries wolf on every build is a warning nobody reads.
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

/**
 * Two tiers, because "the build fails" and "one optional path degrades" are not the
 * same problem and should not have the same consequence.
 *
 * Required: absence breaks the site for every visitor, or removes a guard that is the
 * only thing standing between a bot loop and a bill. These stop a deploy.
 */
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    // Powers the chat assistant and text-to-SQL. Both are public routes, so a deploy
    // without this key gives every visitor a 500 the moment they open the widget.
    'ANTHROPIC_API_KEY',
    // Admin auth fails closed without these. They are listed here so a deploy that
    // forgets them breaks loudly at build time — the previous arrangement fell back
    // to a password published in the repo and nobody would have noticed.
    'ADMIN_PASSWORD',
    'SESSION_SECRET',
    // The AI spend guard counts requests in Redis. Without these it has nowhere to
    // count, and src/lib/ai/budget.ts falls through to its "local dev" branch and
    // allows everything — which is exactly the configuration that must never reach
    // production, since the ceiling is the only thing between a bot loop and a bill.
    //
    // An array means "any one of these" — the same Upstash database arrives under
    // UPSTASH_REDIS_REST_* from Upstash's own dashboard and under KV_REST_API_* from
    // Vercel's Marketplace integration, and src/lib/ratelimit.ts accepts either.
    // Demanding the first pair failed a deploy where the second pair was present and
    // the database was working perfectly well.
    ['UPSTASH_REDIS_REST_URL', 'KV_REST_API_URL'],
    ['UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_TOKEN'],
];

/** Is this requirement satisfied? An array is satisfied by any one of its names. */
const isSet = (entry) =>
    Array.isArray(entry) ? entry.some((key) => process.env[key]) : Boolean(process.env[entry]);

/** How to name a requirement in a message. */
const label = (entry) => (Array.isArray(entry) ? entry.join(' or ') : entry);

/**
 * Recommended: absence costs one optional path and nothing else. These warn.
 *
 * Empty at present. ELEVENLABS_API_KEY lived here until /api/speak and /api/stt were
 * deleted — voice runs in the browser now, so nothing at runtime reads it. The key is
 * still needed by scripts/generate-audio.mjs, which is run by hand and loads .env
 * itself, so it is not a deploy concern.
 */
const recommendedEnvVars = [];

console.log('🔍 Validating Environment Variables...');

const missingRequired = requiredEnvVars.filter(entry => !isSet(entry)).map(label);
const missingRecommended = recommendedEnvVars.filter(entry => !isSet(entry)).map(label);

if (missingRecommended.length > 0) {
    console.warn(`ℹ️  Optional variables not set: ${missingRecommended.join(', ')}`);
    console.warn('   The site works without them; the features they power stay switched off.');
}

if (missingRequired.length > 0) {
    console.warn(`⚠️  Warning: The following environment variables are missing: ${missingRequired.join(', ')}`);
    console.warn('   The build will proceed locally, but features relying on them (e.g., Guestbook, Chat) may fail at runtime.');

    // Fail the build in CI/CD environments to prevent broken deployments
    if (process.env.CI || process.env.VERCEL) {
        console.error('❌ Error: Missing environment variables in CI/Production environment.');
        process.exit(1);
    }
} else {
    console.log('✅ Environment Validated.');
}
