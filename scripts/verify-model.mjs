/**
 * Assert that the model the site is configured to use is still served.
 *
 * This exists because the site's chat was dead in production and nothing said so:
 * the pinned model had been retired, every request came back 404, and the error was
 * swallowed into a generic 500. Run this after changing CHAT_MODEL, and on a
 * schedule if you want retirement caught before a visitor does.
 *
 *   npm run verify:model
 */
import fs from 'node:fs';
import { readChatModel } from './read-model.mjs';

function readKey() {
    if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
    for (const p of ['.env.local', '.env']) {
        if (!fs.existsSync(p)) continue;
        const m = fs.readFileSync(p, 'utf8').match(/ANTHROPIC_API_KEY=(.*)/);
        if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
    return '';
}

const key = readKey();
if (!key) {
    console.error('❌ No ANTHROPIC_API_KEY found in the environment, .env.local or .env');
    process.exit(1);
}

const configured = readChatModel();
console.log(`Checking ${configured}...`);

const res = await fetch(`https://api.anthropic.com/v1/models/${configured}`, {
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
});

if (res.ok) {
    const model = await res.json();
    console.log(`\n✨ SUCCESS: ${model.id} (${model.display_name}) is available.`);
    console.log(`   context window: ${model.max_input_tokens?.toLocaleString() ?? 'n/a'} tokens`);
    console.log(`   max output:     ${model.max_tokens?.toLocaleString() ?? 'n/a'} tokens`);
} else {
    const body = await res.json().catch(() => ({}));
    console.error(`\n❌ FAIL: ${configured} returned HTTP ${res.status}.`);
    console.error(`   ${body?.error?.message ?? 'No detail returned.'}`);
    if (res.status === 404) {
        console.error('   The model id is wrong or the model has been retired.');
        console.error('   Update CHAT_MODEL in src/lib/ai/model.ts.');
    }
    process.exitCode = 1;
}
