# Optimization Report V2: The Next Level

Great work on the first sprint. Now we can target deeper architectural improvements.

## 1. True Image Optimization (High Impact)

**Current Status**: `astro.config.mjs` is set to `passthroughImageService()`. This means images are served "as is" without compression or format conversion (WebP/AVIF).
**Proposal**:

- **Enable Sharp**: Switch to Astro's default Sharp service.
- **Migration**: Identify all `<img>` tags and convert them to `<Image />` (starting with the heaviest pages like Gallery or Training Stats).
- **Benefit**: dramatic reduction in bandwidth and faster Load Largest Contentful Paint (LCP).

## 2. Lazy Loading Heavy Assets (Performance)

**Current Status**: `TrainingStatsPage` loads `Chart.js` immediately, even if charts are not in view.
**Proposal**:

- **Hydration Directive**: Move charts to isolated React/Preact components and load them with `client:visible`.
- **Benefit**: The initial JavaScript bundle shrinks significantly, making the page interactive faster.

## 3. Automated Quality Assurance (Stability)

**Current Status**: You have `@playwright/test` and `@axe-core/playwright` installed but (likely) unused.
**Proposal**:

- **Sanity Check**: Create a `smoke.test.ts` that visits every page and checks for 200 OK.
- **Accessibility Audit**: Add an automated check that fails the build if new accessibility violations (contrast, missing labels) are introduced.
- **Benefit**: "Sleep well at night" stability. You'll know if a deploy breaks *before* it goes live.

## 4. Input Validation (Fort Knox Security)

**Current Status**: `api.ts` types the *output*, but we don't validate the *input* from Supabase.
**Proposal**:

- **Zod Schemas**: Define Zod schemas for `Book`, `Podcast`, etc.
- **Runtime Check**: If Supabase returns malformed data (e.g., missing title), the app will log a clear error instead of crashing silently or showing broken UI.

## Recommendation

I recommend starting with **1. True Image Optimization** and **3. Automated QA**. These provide the most visible benefits.
