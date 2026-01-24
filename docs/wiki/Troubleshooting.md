# Troubleshooting 🔧

Hvis noget går galt (det er software, det sker).

## "Database connection failed"
*   **Årsag**: Supabase er måske i 'pause' mode (hvis du bruger den gratis tier), eller dine `.env` variabler er forkerte.
*   **Løsning**: Log ind på Supabase og væk projektet, eller tjek at `PUBLIC_SUPABASE_URL` er korrekt.

## "AI svarer ikke / tænker evigt"
*   **Årsag**: Gemini API nøglen er ugyldig eller kvoten er opbrugt.
*   **Løsning**: Tjek server logs i Vercel dashboardet.

## "Jeg kan ikke logge ind på Dashboard"
*   **Årsag**: Koden er hardcodet i `dashboard.astro` eller `api/auth`.
*   **Løsning**: Tjek kildekoden for `CORRECT_CODE` variablen. Default er ofte "quantum".
