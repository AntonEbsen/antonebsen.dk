
import fs from 'fs';
import path from 'path';
import https from 'https';

const envPath = path.resolve('.env');
const localEnvPath = path.resolve('.env.local');
let apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
    if (fs.existsSync(localEnvPath)) {
        const content = fs.readFileSync(localEnvPath, 'utf-8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
}

if (!apiKey && fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim().replace(/^["']|["']$/g, '');
    }
}

if (!apiKey) {
    console.error("❌ Could not find GEMINI_API_KEY in process.env, .env, or .env.local");
    process.exit(1);
}

console.log(`Checking models for API Key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("❌ API Error:", json.error);
            } else if (json.models) {
                console.log("✅ Available Models:");
                const modelNames = json.models.map(m => m.name.replace('models/', ''));
                modelNames.forEach(m => console.log(` - ${m}`));

                if (modelNames.includes('gemini-1.5-flash')) {
                    console.log("\n✨ SUCCESS: gemini-1.5-flash is available!");
                } else {
                    console.log("\n⚠️ WARNING: gemini-1.5-flash is NOT in the list.");
                }
            } else {
                console.log("Unknown response:", json);
            }
        } catch (e) {
            console.error("Parse error:", e);
            console.log("Raw output:", data);
        }
    });

}).on('error', err => {
    console.error("Request error:", err);
});
