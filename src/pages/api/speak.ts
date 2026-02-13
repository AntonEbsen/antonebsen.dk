
import type { APIRoute } from "astro";
import { ElevenLabsClient } from "elevenlabs";

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { text, voiceId } = body;

        if (!text) {
            return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
        }

        const apiKey = import.meta.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });
        }

        const client = new ElevenLabsClient({ apiKey });
        const voice = voiceId || "vTWuRMncYKymbShl06Ap"; // User provided ID as default

        const audioStream = await client.textToSpeech.convert(voice, {
            text,
            model_id: "eleven_turbo_v2_5", // Low latency model
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            }
        });

        // Convert Node stream to Web ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of audioStream) {
                    controller.enqueue(chunk);
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "audio/mpeg" },
        });

    } catch (error: any) {
        console.error("❌ TTS Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown Error" }), {
            status: 500,
        });
    }
};
