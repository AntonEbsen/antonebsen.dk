import process from 'process';

const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    // Add other critical keys here if needed
];

console.log('🔍 Validating Environment Variables...');

const missingVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.warn(`⚠️  Warning: The following environment variables are missing: ${missingVars.join(', ')}`);
    console.warn('   The build will proceed, but features relying on them (e.g., Guestbook, Chat) may fail at runtime or during data fetching.');
    // In strict mode, we might want to exit(1), but for now just warn.
    // process.exit(1);
} else {
    console.log('✅ Environment Validated.');
}
