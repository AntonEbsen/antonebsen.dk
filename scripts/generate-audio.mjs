
import fs from 'fs';
import path from 'path';
import { ElevenLabsClient } from 'elevenlabs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
    console.error("❌ ELEVENLABS_API_KEY is missing in .env");
    process.exit(1);
}

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

// Configuration
const VOICE_ID = "vTWuRMncYKymbShl06Ap"; // Anton's Cloned Voice
const OUTPUT_DIR = path.join(__dirname, '../public/assets/audio');
const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

import { pipeline } from 'stream/promises';

// ...

async function generateAudio(text, outputPath) {
    try {
        const audio = await client.textToSpeech.convert(VOICE_ID, {
            text: text,
            model_id: "eleven_turbo_v2_5", // Using Turbo 2.5 for better speed/quality
            output_format: "mp3_44100_128",
        });

        const fileStream = fs.createWriteStream(outputPath);
        await pipeline(audio, fileStream);
    } catch (error) {
        console.error("Error generating audio:", error);
        throw error;
    }
}

async function processBlogPosts() {
    const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.json'));

    console.log(`🔍 Found ${files.length} blog posts.`);

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Skip if audio already exists or no brief
        // We check if audioUrl is present and not empty.
        // We will force update if it's the specific file we are testing or generally if brief exists

        // For now, let's process 'ai-monetary-policy.json' specifically or all that miss audio
        const slug = file.replace('.json', '');

        // Check English (Forcing Update for Anton's Voice)
        if (content.brief && content.brief.length > 0 && (!content.audioUrl || content.audioUrl === "")) {
            console.log(`🎙️ Generating EN audio for: ${content.title}`);
            const text = `${content.title}. ${content.brief.join('. ')}`;
            const filename = `${slug}-en.mp3`;
            const audioPath = path.join(OUTPUT_DIR, filename);
            const publicUrl = `/assets/audio/${filename}`;

            try {
                await generateAudio(text, audioPath);
                content.audioUrl = publicUrl;
                console.log(`✅ Saved to ${publicUrl}`);
            } catch (e) {
                console.error(`❌ Failed EN generation for ${slug}`, e);
            }
        }

        // Check Danish (if applicable, using English voice for now or skip? 
        // User implied "The Signal Voice" is English ("Experience: The Signal Voice").
        // But schema has audioUrl_da.
        // Let's use a Danish voice if we can find one, otherwise skip or use English voice (bad idea).
        // For this MVP, let's stick to English or check if we can switch voice.
        // "eleven_turbo_v2" supports English. "eleven_multilingual_v2" supports Danish.

        const DANISH_VOICE_ID = "vTWuRMncYKymbShl06Ap"; // Anton's Voice (Multilingual)
        // Let's use "eleven_multilingual_v2" model for Danish.

        if (content.brief_da && content.brief_da.length > 0 && (!content.audioUrl_da || content.audioUrl_da === "")) {
            console.log(`🎙️ Generating DA audio for: ${content.title_da || content.title}`);
            const text = `${content.title_da || content.title}. ${content.brief_da.join('. ')}`;
            const filename = `${slug}-da.mp3`;
            const audioPath = path.join(OUTPUT_DIR, filename);
            const publicUrl = `/assets/audio/${filename}`;

            try {
                // Use multilingual model
                const audio = await client.textToSpeech.convert(VOICE_ID, {
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    output_format: "mp3_44100_128",
                });

                const fileStream = fs.createWriteStream(audioPath);
                await pipeline(audio, fileStream);

                content.audioUrl_da = publicUrl;
                console.log(`✅ Saved DA to ${publicUrl}`);
            } catch (e) {
                console.error(`❌ Failed DA generation for ${slug}`, e);
            }
        }

        // Save back JSON
        fs.writeFileSync(filePath, JSON.stringify(content, null, 4));
    }
}

processBlogPosts().then(() => console.log("🎉 Done processing audio."));
