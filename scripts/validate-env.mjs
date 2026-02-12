import process from 'process';

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
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
