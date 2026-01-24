# Security & Privacy 🔒

Hvordan vi passer på dataen.

## Chat Logs
*   Alle samtaler gemmes i **Supabase** (`chat_logs`).
*   Data bruges **kun** til at vise historik og forbedre svar.
*   Ingen tredjepart (udover Google til inferens) ser dataen.

## Dashboard Adgang
*   Beskyttet med en "Gatekeeper" (simpel adgangskode).
*   **Bemærk**: Dette er "Security by Obscurity" på frontend-niveau. For ægte sikkerhed bør man implementere Supabase Auth (Email/Password).
*   API-kald er beskyttet via RLS (Row Level Security) policies i databasen (hvis aktiveret).

## Miljøvariabler
*   API-nøgler (`GEMINI_API_KEY`, `SUPABASE_KEY`) ligger aldrig i koden.
*   De injiceres kun under build-processen på serveren.
