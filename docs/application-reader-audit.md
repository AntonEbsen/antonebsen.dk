# Application-reader audit

Date: 22 October 2026. Candidate based on merged website revision `437d070`.

## Scope

English and Danish application journeys: homepage, compact academic CV, About, research overview, and the demography, St. Croix thesis, GenAI proposal, and welfare-state project pages. Local main-content links, fragments and images were fetched; selected navigation, canonical/hreflang links, PDF downloads, and the retained extended CV were checked by the existing application tests.

This is not a certification of every personal/archive page, every external destination, the unfinished research, or the entire empirical repository. Optional live-service forms, login, and AI endpoints were not exercised. Browser checks block external requests and do not submit forms.

## Content and attribution

- Added a visible individual-contribution section to all four project summaries in both languages.
- Demography responsibilities are supported by the sole-authored submitted paper, especially its data and identification discussion. Existing digitized data are distinguished from new archival transcription.
- The author confirmed responsibility for thesis transcription, linkage and cleaning, and the main contribution to empirical design and planter-model calibration. It remains a joint, unfinished thesis, with no final results claimed.
- The author confirmed responsibility for the welfare paper’s econometric analysis, code and the chapters documenting that analysis. No leadership of the literature review is claimed.
- The GenAI role remains the author-confirmed lead contribution to the empirical strategy; proposed data and methods are not presented as completed analysis.
- Coauthors remain credited. The canonical collaborator spelling and the older ECB page’s web citation now use the author-supplied “Jonas Amassa Skov Nielsen”; shorter author forms printed in existing papers are not rewritten.
- BSc awarded May 2024, MSc started September 2024, expected completion January 2027, project stages and course grades are retained. Referee details are not published.

Author-confirmed roles are attribution statements, not an independent audit of private work. The unfinished thesis and group proposal remain private. The submitted papers are unchanged; only the academic CV PDF was regenerated from its shared web/PDF source.

## One actual source-to-data example

The demography page shows only the fields of the actual excluded record already documented in the fixed October 2026 validation report: `VIT1867.XLS`, `Code = 545`, `Year = 1866`.

Its structured representation preserves those values and records `in_study_window: false`, `decision: "exclude"`. It does not silently change the year to match the filename. The example links to the fixed report and provider; it is labelled as a later AI-assisted check of already-digitized historical data, not a facsimile, new archival transcription, or validation of regression results. No raw workbook is added to the website.

## Findings repaired

1. Danish About links pointed to missing `#fokus`, `#formidling`, `#udenfor` and `#kontakt` targets. They now point to the actual section IDs; the working Danish `#arbejdsstil` target is retained.
2. Browser printing of both compact CVs originally spilled onto a second page. CV-only print spacing was tightened while retaining 9.5-point body text and full content. Both now print on one A4 page.
3. Variable-font PDF rendering produced inconsistent glyphs in one print preview. The CV-only print stylesheet now uses standard Arial/Helvetica-family fonts. Screen typography is unchanged. Both final print outputs were visually inspected.
4. Updated the English downloadable CV and both web CVs with confirmed thesis and welfare-paper responsibilities. The download remains one searchable page, visually checked and tested against the English source text.

## Verification record

- Full unit suite: **451 passed**. Includes matching web/PDF CV text and page count, project status, attribution, actual source fields, collaborator spelling, and production-domain routing.
- Combined application browser suite: **56 passed**. The final dedicated reader-audit rerun: **17 passed**, covering the final source/print polish. No retries were used in these audit runs.
- Mobile checks: 390-pixel viewport, no horizontal overflow, and WCAG A/AA axe checks on the contribution and source-example sections in both languages; existing application tests cover the CV and full demography page.
- Both browser-printed CVs and the downloadable CV: one A4 page; final renders inspected for legibility and clipping. The browser print files are QA artifacts, not additional public downloads.
- Production build succeeded; type-error ratchet remains at **419**, with no relaxation. This is not a claim that the broader repository is type-error free.
- Live read-only HEAD checks returned 200 after redirects: both `antonebsen.com/` and `www.antonebsen.com/` ended at `https://www.antonebsen.com/en`; `antonebsen.dk/` remained Danish at its root.

Reproduction commands, from an environment with the existing locked dependencies:

```sh
npm run test:unit
npx playwright test tests/application-reader-audit.spec.ts tests/academic-profile.spec.ts tests/application-readiness.spec.ts tests/application-research-polish.spec.ts tests/demography-scholar.spec.ts --project=chromium --workers=2 --retries=0
node scripts/check-ratchet.mjs
npm run build
```

Use an isolated checkout: builds regenerate tracked Astro cache files, and browser tests write QA artifacts. This change excludes those caches, temporary preview configuration, private material and secrets. Publication and final CI/deployment state are reported separately in the pull request; a local audit does not establish that production has updated.
