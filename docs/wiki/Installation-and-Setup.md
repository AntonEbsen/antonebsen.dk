# Deployment Guide 🚀

Dette er den "officielle" guide til at få systemet live.

## 1. Supabase (Backend)
1. Gå til [Supabase](https://supabase.com) og opret et nyt projekt.
2. Gå til **SQL Editor** og kør scripts for at oprette tabellerne (se `README.md` for listen).
3. Gå til **Project Settings > API**.
4. Kopier `Project URL` og `anon public key`.

## 2. Google Gemini (AI Brain)
1. Gå til [Google AI Studio](https://makersuite.google.com/).
2. Opret en ny **API Key**.

## 3. Vercel (Hosting)
1. Installer Vercel CLI eller forbind via GitHub.
2. Importer projektet.
3. Under **Environment Variables**, tilføj:
    *   `PUBLIC_SUPABASE_URL`: (Din URL fra trin 1)
    *   `PUBLIC_SUPABASE_ANON_KEY`: (Din Key fra trin 1)
    *   `GEMINI_API_KEY`: (Din Key fra trin 2)

## 4. Deploy
Tryk **Deploy**. Vercel vil bygge Astro-projektet og hoste det som Serverless functions.
Alt bør nu virke!
