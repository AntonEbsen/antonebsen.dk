# Academic reading layout and Figure 4.1 reproduction

22 October 2026; based on website main `39bb092` (merged PR #25).

## Changes

- Existing `isAcademicPath` defines the English/Danish homepage, CV, About,
  Contact, research index and four application project routes. These routes
  omit global/project AI chat, game interfaces, command palette, copy pop-ups,
  personalization banners and persistent blackletter mode. Navbar search and
  links to the wider personal site remain. Academic visits do not alter game
  progress or erase stored personal settings.
- Academic reveal/pulse animations are disabled. Personal routes retain their
  features; no personal pages are deleted.
- Four bilingual project briefs present question, data, method and finding or
  status in under 115 words, followed by visible individual contribution and
  attribution. Detailed responsibilities and research explanations use native
  disclosures. The welfare paper's existing charts/tables/text are retained
  behind its full-analysis disclosure, with one primary page heading.
- Scope, attribution, unfinished/proposal status and causal limitations remain
  explicit. Demography citation/Scholar metadata, PDF bytes, download aliases,
  original abstract in the PDF and the expanded web explanation are retained.
- Deep links to the detailed paper open the relevant disclosure. Native
  disclosures and compact text work without JavaScript.
- The demography check links an immutable narrow reproduction package at
  `be82847e662fa73023fe8895810357cf31b08f84`, not evolving `main`. It explains
  Python 3.12, installation, exact-source preflight, new output folders and the
  distinction between report/numerical reproduction and identical image pixels.

## Verification

- 462 unit tests passed; the type-error ratchet remained 419 and the production
  build passed without changing baselines.
- Combined application browser suite: 64 passed without retries. It checks
  routes, mobile fit, downloads/PDF hashes, contribution, print, links, native
  disclosures, quiet mode with stored preferences and deep links.
- Final reader-specific rerun: 8 passed with the final package revision. All
  three existing homepage/About/mobile visual comparisons passed unchanged;
  additional English/Danish compact-page and recipe renders were inspected.
- Personal-feature regression run: 74 passed; broader accessibility/readiness
  run: 34 passed. These overlap the application checks, so do not add the counts
  as unique tests. Existing game/palette/chat tests now exercise personal routes
  where those features are intentionally retained. Accessibility tests open the
  welfare paper's disclosure so charts are still inspected after hydration.
- The narrow package passed from a fresh local clone with an initially absent
  virtual environment and outputs. All 12 safeguards and every report field
  matched; all 29 raw-file hashes matched before/after. The figure was rendered
  and visually inspected. The separately recorded approximately-22% prose
  discrepancy remains, and no regression is validated.
- Dedicated package CI passed on Windows and Linux. Refer to
  [Demography PR #59](https://github.com/AntonEbsen/Demography/pull/59) for current
  status rather than treating this document as a live monitor.

## Limits and unrelated issues

The earlier audit's scope limits still apply. Live service forms and model calls
were not submitted, and this is not certification of the wider legacy site or
the unfinished research. Build warnings for missing assets elsewhere remain;
no missing-asset or type-error baseline was relaxed.

Demography's broader lint and DVC workflows also failed on its base revision.
Their failures are separate from the passing narrow reconstruction. GitHub's
existing dependency alerts are in `archived/portfolio/package-lock.json` and
`kulturkampf_site/package-lock.json`, not in the 17-package Python recipe. Those
web dependencies were not deployed or changed. The narrow workflow passing is
not a repository-wide security clearance.

No thesis material is published. Coauthor approval for a de-identified example
has been confirmed, but a candidate still needs source-specific permission and
source-to-output verification. The private thesis checkout was not edited.

Generated caches, private material, local preview config, screenshots and Python
environments are not included in the website change. Production publication
requires a separate merge/deployment; a successful local build is not proof of
an updated public site.
