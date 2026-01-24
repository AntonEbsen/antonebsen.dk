# Anton Ebsen - Personal Operating System (POS) 🚀

Velkommen til koden bag **antonebsen.dk**. 
Dette er ikke bare en portefølje; det er et **Personal Operating System**, bygget til at forene personlig branding, AI-interaktion og data tracking i én samlet platform.

Hjemmesiden fungerer som min digitale base, hvor besøgende kan interagere med min AI-avatar, og jeg kan administrere mit liv via et lukket dashboard.

![Status](https://img.shields.io/badge/Status-Live-success) ![Tech](https://img.shields.io/badge/Stack-Astro%20%7C%20Supabase%20%7C%20Tailwind-blueviolet)

---

## ✨ Features

### 1. Quantum Chatbot (AI) 🤖
En integreret AI-assistent drevet af **Gemini Pro**, tunet til at agere på mine vegne.
*   **Personaer**: Kan skifte mellem "Professional Analyst" og "Casual Coder".
*   **RAG (Retrieval-Augmented Generation)**: Har adgang til mit CV og dokumenter for at svare præcist.
*   **Hukommelse**: Husker samtalen på tværs af sider.
*   **Værktøjer**: Kan booke møder og vise grafer.

### 2. The Dashboard (Command Center) 🎛️
Et password-beskyttet admin-panel, hvor jeg styrer dataen bag siden.
*   **Living Library**: Bogliste over hvad jeg læser.
*   **Quantified Self**: Træningslog (Styrke/Løb).
*   **World Map Manager**: Styring af lokationer på verdenskortet.
*   **Quote Bank**: Samling af citater.
*   **Analytics**: Grafer over brugernes interaktion med AI'en (Intents/Personaer).

### 3. Living World Map 🌍
Et interaktivt kort (`/map`) der visualiserer min fysiske rejse.
*   Data hentes live fra **Supabase**.
*   Filtrering på: **Hjem / Studier / Rejser**.

### 4. Retro Guestbook 📼
En digital gæstebog (`/guestbook`) med Web 1.0 vibes.
*   Besøgende kan lægge en hilsen.
*   **Moderations-kø**: Alle beskeder skal godkendes i Dashboardet før de vises live.

---

## 🛠️ Tech Stack

*   **Frontend**: [Astro](https://astro.build/) (Hurtig, statisk-først rendering).
*   **Styling**: Tailwind CSS + Custom "Gold/Dark" Design System.
*   **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL).
*   **AI**: Google Gemini Pro via Serverless Functions.
*   **Hosting**: Vercel / Netlify.

---

## 🚀 Kørselsvejledning

Vil du køre projektet lokalt?

### 1. Klon repository
```bash
git clone https://github.com/dinbrugernavn/antonebsen.dk.git
cd antonebsen.dk
```

### 2. Installer dependencies
```bash
npm install
```

### 3. Sæt miljøvariabler (.env)
Opret en `.env` fil i roden med følgende:
```env
PUBLIC_SUPABASE_URL=din_supabase_url
PUBLIC_SUPABASE_ANON_KEY=din_supabase_key
GEMINI_API_KEY=din_gemini_key
```

### 4. Start serveren
```bash
npm run dev
```
Siden kører nu på `http://localhost:4321`.

---

## � Projektstruktur

Her er et overblik over vigtige mapper i projektet:

*   **[`src/`](src/)**: Selve kildekoden.
    *   **[`pages/`](src/pages/)**: Indeholder alle sideruterne (Astro).
        *   [`api/`](src/pages/api/): Server-side endpoints til Chatbot, Dashboard, etc.
        *   [`dashboard.astro`](src/pages/dashboard.astro): Admin-panelet.
        *   [`map.astro`](src/pages/map.astro): Det interaktive verdenskort.
    *   **[`layouts/`](src/layouts/)**: Genbrugelige layout-komponenter.
    *   **[`components/`](src/components/)**: UI-komponenter (Knapper, Kort, Chat Widget).
    *   **[`data/`](src/data/)**: Statiske JSON-filer og dokumenter til RAG.
*   **[`public/`](public/)**: Statiske filer (billeder, ikoner) der serveres direkte.
*   **[`scripts/`](scripts/)**: Hjælpe-scripts til build eller vedligeholdelse.

---

## �💾 Database Schema (Supabase)

Projektet kræver følgende tabeller i Supabase:

*   `chat_logs` (AI samtale historik)
*   `books` (Bogtitler + status)
*   `training_logs` (Dato, type, distance, tonnage)
*   `quotes` (Tekst + forfatter)
*   `travel_locations` (Lat, Lng, City, Category: 'hjem'|'rejser'...)
*   `guestbook` (Navn, Besked, Approved: boolean)

---

## 📬 Kontakt

Har du spørgsmål til koden eller arkitekturen?
Du kan fange mig på [LinkedIn](https://www.linkedin.com/in/antonebsen) eller via kontaktformularen på siden.

*Bygget med ❤️ og for meget kaffe i København.*
