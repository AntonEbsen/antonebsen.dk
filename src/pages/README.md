# Pages & Routes 📄

Astro bruger fil-baseret routing. Hver fil her svarer til en URL på sitet.

## Nøglefiler

### Offentlige Sider
*   **`index.astro`**: Forsiden.
*   **`cv.astro`**: Mit digitale CV.
*   **`map.astro`**: Det interaktive verdenskort (Living World Map).
*   **`guestbook.astro`**: Den offentlige gæstebog.
*   **`ai-project.astro`**: Dokumentation om AI-projektet.

### Admin / Privat (Password Protected)
*   **`dashboard.astro`**: "Mission Control" Dashboard. Kræver kodeord. Herfra styres data (bøger, træning, rejser, gæstebog).

### Server Endpoints (API)
*   Se [`api/`](api/) mappen for backend-logik.
