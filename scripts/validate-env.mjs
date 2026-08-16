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
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
];

/**
 * Recommended: absence costs one optional path and nothing else. These warn.
 *
 * ELEVENLABS_API_KEY was briefly in the list above, on the reasoning that /api/speak
 * is reachable by logged-out visitors and 500s without it. That over-stated the
 * damage: the read-aloud button under each answer uses the browser's own
 * speechSynthesis, so it works regardless. /api/speak is reached only after *voice*
 * input, to read the reply back in a better voice, and the client already wraps that
 * call in a try/catch. So the cost of a missing key is that speaking to the assistant
 * gets a written answer instead of a spoken one — which is not worth refusing to
 * deploy the site over.
 */
const recommendedEnvVars = [
    'ELEVENLABS_API_KEY',
];

console.log('🔍 Validating Environment Variables...');

const missingRequired = requiredEnvVars.filter(key => !process.env[key]);
const missingRecommended = recommendedEnvVars.filter(key => !process.env[key]);

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
