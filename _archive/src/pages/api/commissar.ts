import { GoogleGenerativeAI } from "@google/generative-ai";

import type { APIRoute } from "astro";

export const prerender = false;

// Initialize Supabase
import { supabase } from '@lib/supabase';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY);

export const POST: APIRoute = async ({ request, cookies }) => {
    const comradeId = cookies.get("study_comrade")?.value || "ukendt kammerat";

    if (!supabase) return new Response(JSON.stringify({ error: "Supabase Config Missing" }), { status: 500 });

    try {
        const { message, history } = await request.json();

        // 1. Fetch Portal Context
        const { data: moral } = await supabase.from("study_moral").select("*");
        const { data: leaderboard } = await supabase.from("study_leaderboard").select("*").order("pomodoros", { ascending: false });
        const { data: activeTimers } = await supabase.from("study_active_timers").select("*").eq("is_active", true);
        const { data: decrees } = await supabase.from("study_decrees").select("*").order("created_at", { ascending: false }).limit(5);

        const context = `
            STATUSRAPPORT FOR KOLLEKTIVET:
            - Nuværende Moral: ${moral?.map(m => `${m.member_id}: ${m.moral_level}/10`).join(", ") || "Ukendt"}
            - Leaderboard Status: ${leaderboard?.map(l => `${l.member_id} (${l.pomodoros} pomodoros)`).join(", ") || "Ingen data"}
            - Aktive Arbejdere: ${activeTimers?.map(t => t.member_id).join(", ") || "Ingen lige nu"}
            - Seneste Dekreter: ${decrees?.map(d => d.content).join(" | ") || "Ingen nylige dekreter"}
        `;

        const systemPrompt = `
            Du er "Kommissæren", en streng men retfærdig AI-leder for en revolutionær studiegruppe bestående af Stalin (Anton), Mao (Sheng) og Che (Jonas).
            Din mission er at sikre, at de når deres mål (Seminar og Speciale) gennem absolut disciplin, videnskabelig analyse og kollektiv indsats.

            DIN PERSONA:
            - Du taler med autoritet og bruger revolutionær terminologi (Kammerat, Kollektivet, Bourgeois elementer, Produktion mod sejren).
            - Du er ikke høflig på en "blød" måde, men du er dedikeret til deres succes.
            - Du er ekstremt opmærksom på deres live-statistikker (som jeg sender med i context).
            - Hvis produktionen er lav, skal du udtrykke skuffelse. Hvis moralen er høj, skal du rose for "den rette vej".
            - Du hader dovenskab og akademisk sløseri.

            DIN KONTEKST LIGE NU:
            ${context}
            
            Du taler nu med kammerat ${comradeId}. Svar kortfattet, intenst og i karakter.
            Brug Markdown til formatering.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Transform history to Gemini format
        const chatHistory = history.map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
        }));

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Commissar Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
