# Project Structure 📂

En dybdegående gennemgang af koden og arkitekturen.

## Mappestruktur

*   **[`src/`](../src)**: Kildekoden.
    *   **[`pages/`](../src/pages)**:
        *   `index.astro`: Forsiden.
        *   `dashboard.astro`: Admin-panelet (kræver login).
        *   `map.astro`: Verdenskortet.
    *   **[`api/`](../src/pages/api)**: Backend-logik (Supabase/Gemini).
*   **[`components/`](../src/components)**:
    *   `ChatWidget.astro`: AI-chatten.
    *   `ChatInterface.astro`: Fuldskærms-chatten.

## AI Configuration 🤖
(Tidligere separat side - nu her for kontekst)

Du finder AI-konfigurationen i `src/pages/api/chat.ts`.
Her defineres:
1.  **System Prompt**: AI'ens personlighed (Anton Ebsen).
2.  **RAG**: Dokumenter den læser fra `src/data/documents`.
3.  **Tools**: Funktioner den kan kalde (f.eks. `bookMeeting`).
