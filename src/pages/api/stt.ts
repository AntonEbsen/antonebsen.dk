
import type { APIRoute } from "astro";
import { ElevenLabsClient } from "elevenlabs";

export const POST: APIRoute = async ({ request }) => {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            console.error("❌ STT: No audio file provided");
            return new Response(JSON.stringify({ error: "No audio file provided" }), {
                status: 400,
            });
        }

        console.log(`🎤 STT Received: ${audioFile.name} (${audioFile.size} bytes, type: ${audioFile.type})`);

        const apiKey = import.meta.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.error("❌ STT: Missing API Key");
            return new Response(JSON.stringify({ error: "Missing API Key" }), {
                status: 500,
            });
        }

        const client = new ElevenLabsClient({ apiKey });

        // Use Scribe 1
        const transcription = await client.speechToText.convert({
            file: audioFile,
            model_id: "scribe_v1",
            tag_audio_events: false,
        });

        return new Response(JSON.stringify({ text: transcription.text }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ STT Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown Error" }), {
            status: 500,
        });
    }
};
