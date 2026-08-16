// Smoke test for /api/chat against a running dev server.
//
// /api/chat streams plain text, so the previous `res.json()` here always threw — the
// script could never have reported a reply.
//
//   npm run dev          (in one shell)
//   node scripts/test-chat.mjs

const BASE = process.env.CHAT_BASE_URL || 'http://localhost:4321';

(async () => {
    try {
        const res = await fetch(`${BASE}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({ message: 'Who is Anton?', lang: 'en' }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
            console.error(`❌ HTTP ${res.status}:`, await res.text());
            process.exit(1);
        }

        process.stdout.write('AI Reply: ');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let reply = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            reply += chunk;
            process.stdout.write(chunk);
        }
        console.log('\n');

        if (!reply.trim()) {
            console.error('❌ Empty reply.');
            process.exit(1);
        }
    } catch (e) {
        console.error('❌', e);
        process.exit(1);
    }
})();
