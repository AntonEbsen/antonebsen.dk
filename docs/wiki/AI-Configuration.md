# AI Configuration & Personas 🤖

Hjernen bag systemet er `src/pages/api/chat.ts`. Her styrer vi, hvordan AI'en opfører sig.

## System Prompts
Vi bruger en teknik kaldet "System Prompt Injection". Før brugerens besked sendes til Gemini, indsætter vi en usynlig instruktion:

> "Du er Anton Ebsen. Du er en passioneret økonomistuderende og koder..."

### Sådan ændrer du personligheden
Rediger filen `src/pages/api/chat.ts` og find variablen `SYSTEM_PROMPT`.
Her kan du justere tonen.
*   **Mere professionel?** Tilføj "Brug formelt sprog og fokuser på akademiske resultater."
*   **Mere nørdet?** Tilføj "Du elsker at bruge tech-metaforer."

## RAG (Retrieval Augmented Generation)
AI'en "gætter" ikke bare. Den læser filer fra `src/data/documents/` (f.eks. `cv.json` eller tekstfiler).
Hvis du vil lære AI'en noget nyt (f.eks. om et nyt projekt), skal du blot tilføje en fil i den mappe. Systemet samler det automatisk op.

## Personaer (Frontend)
I `src/components/ChatWidget.astro` kan brugeren vælge "Casual" eller "Professional".
Dette sender en ekstra instruktion med til API'et:
*   `mode='professional'` -> Tilføjer "Svar kort og præcist."
*   `mode='casual'` -> Tilføjer "Brug emojis og vær afslappet."
