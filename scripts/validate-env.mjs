import process from 'process';
import dotenv from 'dotenv';

// Load the same files Astro does, in the same precedence order (a real environment
// variable wins, then .env.local, then .env — dotenv never overwrites what is already
// set). Without this the check reads process.env only, so a local build warned that
// ANTHROPIC_API_KEY was missing while the site ran fine with it in .env. A warning
// that cries wolf on every build is a warning nobody reads.
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

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
    // /api/speak and /api/stt are reachable by logged-out visitors, so a deploy
    // without this key gives every one of them a 500 from the chat's speak button.
    'ELEVENLABS_API_KEY',
    // The AI spend guard counts requests in Redis. Without these it has nowhere to
    // count, and src/lib/ai/budget.ts falls through to its "local dev" branch and
    // allows everything — which is exactly the configuration that must never reach
    // production, since the ceiling is the only thing between a bot loop and a bill.
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    // Add other critical keys here if needed
];

console.log('🔍 Validating Environment Variables...');

const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.warn(`⚠️  Warning: The following environment variables are missing: ${missingVars.join(', ')}`);
    console.warn('   The build will proceed locally, but features relying on them (e.g., Guestbook, Chat) may fail at runtime.');

    // Fail the build in CI/CD environments to prevent broken deployments
    if (process.env.CI || process.env.VERCEL) {
        console.error('❌ Error: Missing environment variables in CI/Production environment.');
        process.exit(1);
    }
} else {
    console.log('✅ Environment Validated.');
}
