# Website Health & Optimization Report

## 1. Stability & Code Quality

**Current Status:** Good. Core pages use a centralized API. `humans.txt` and `robots.txt` are standard.
**Opportunities:**

- [ ] **Strict Type Re-Integration**: Now that `src/lib/api.ts` exists and works, we should revisit the pages (Books, Certifications, etc.) and replace `any[]` with strict `Book[]`, `Certification[]` types. This ensures compile-time safety.
- [ ] **Component Extraction**:
  - `CertificationsPage` -> `CertificationCard.astro`
  - `PodcastsPage` -> `PodcastCard.astro`
  - `TimelinePage` -> `TimelineItem.astro`
  - `BucketListPage` -> `BucketItem.astro`
  - *Benefit*: Reduces code duplication, ensures consistent styling, and makes pages easier to read.
- [ ] **Script Bundling**: Move `public/assets/js/search.js` and `themes.js` into `src/scripts/`.
  - *Benefit*: Vite will bundle, minify, and hash these scripts, improving load performance and caching handling.

## 2. Performance & Optimization

**Current Status:** Static generation (mostly). External assets (Fonts/Icons) loaded via CDN.
**Opportunities:**

- [ ] **Self-Host Fonts**: Currently loading from `fonts.googleapis.com`.
  - *Action*: Use `@fontsource/inter` to host fonts locally.
  - *Benefit*: Eliminates extra DNS lookups and layout shifts (CLS).
- [ ] **Optimize Icons**: Currently loading the entire FontAwesome library (CSS+Webfonts) via CDN.
  - *Action*: Switch to `astro-icon` or an SVG sprite for only the icons you actually use.
  - *Benefit*: Massive reduction in CSS/Font payload size.
- [ ] **Image Optimization**:
  - *Action*: Once source images are available, move all `public/assets/img` to `src/assets` and use `<Image />` component.
  - *Benefit*: Automatic responsive sizing and WebP conversion.

## 3. Operations & Security

**Current Status:** Strong. CSP, HSTS, Rate Limiting active.
**Opportunities:**

- [ ] **Automated Dependency Audits**: Add `npm audit` to your CI/CD pipeline (GitHub Actions/Vercel) to block deploys if vulnerabilities are found.
- [ ] **Uptime Monitoring**: Set up a free uptime monitor (e.g., UptimeRobot) to ping `antonebsen.dk` every 5 minutes.
