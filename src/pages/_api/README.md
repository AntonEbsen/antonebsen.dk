# API Endpoints ⚡

Server-side logik der kommunikerer med **Supabase** og **Gemini AI**.

## Endpoints

### 🧠 AI & Chat
*   **`chat.ts`**: Hoved-endpoint for chat. Håndterer prompt contextualization, RAG (Retrieval) og kald til Gemini API.
*   **`stats.ts`**: Leverer data til Dashboard-grafer (Persona fordeling, aktivitet).

### 🗄️ CMS / Data
*   **`books.ts`**: Hent/Opret bøger (Living Library).
*   **`training.ts`**: Log træningspas (Quantified Self).
*   **`quotes.ts`**: Citatsamling.
*   **`travel.ts`**: Lokationsdata til verdenskortet.
*   **`guestbook.ts`**: Håndterer gæstebogsbeskeder (Læs offentlige, skriv nye, moderer).
