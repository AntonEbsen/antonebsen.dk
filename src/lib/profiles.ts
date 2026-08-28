/**
 * The academic profiles this site links out to, and nothing it reads from.
 *
 * There is deliberately no fetch in this file, unlike src/lib/orcid.ts. None of these
 * services can be synced:
 *
 *  - **ResearchGate** returns HTTP 403 to every automated request, browser
 *    User-Agent included. No public API, and its terms restrict harvesting content
 *    "without proper permission".
 *  - **Academia.edu** whitelists named search engines and ends its robots.txt with
 *    `User-agent: *` → `Disallow: /`. No public API either.
 *  - **Google Scholar** is the tempting one: robots.txt explicitly allows
 *    `/citations?user=`, and the profile fetches cleanly today. It is still a bad
 *    bet — no API, CAPTCHAs for repeat automated clients, and a citation count that
 *    silently freezes at last year's number is worse than showing none. The site
 *    feeds Scholar instead, through the citation_* meta tags in ProjectDetailPage.
 *
 * So ORCID is the only one of the four that flows *into* the site. These three are
 * links, plus — in Scholar's case — a set of meta tags that let it read the site.
 *
 * One module because the same URLs are otherwise repeated across the footer, the CV
 * sidebar, the contact page, the collaborator record and the team page. The header
 * of src/data/collaborators.ts records what that copying cost last time: one person
 * ended up with two spellings of their name on the site.
 */

export const RESEARCHGATE_PROFILE = 'https://www.researchgate.net/profile/Anton-Meier-Ebsen-Jorgensen';

export const RESEARCHGATE_LAB =
    'https://www.researchgate.net/lab/Applied-Econometrics-Quantitative-Economics-Group-Anton-Meier-Ebsen-Jorgensen';

/**
 * The lab's formal name on ResearchGate.
 *
 * The site's page is "Forskningsteamet" / "Research Group", which stays as it is —
 * this is carried as `alternateName` in the team page's Organization node so a
 * machine can match the two without the page adopting a name that reads badly in
 * three languages.
 */
export const LAB_NAME = 'Applied Econometrics & Quantitative Economics Group';

/**
 * Canonical form: `?user=` only.
 *
 * Scholar is the one profile here whose identity lives in the query string rather
 * than the path, which is why `profileUrl()` in src/lib/orcid.ts had to learn the
 * difference between a parameter that tracks and one that identifies. The `hl=da`
 * and `oi=sra` on a link copied out of the browser are interface language and origin
 * indicator; dropping `user=` with them would point at nobody.
 */
export const GOOGLE_SCHOLAR_PROFILE = 'https://scholar.google.com/citations?user=B4krJWsAAAAJ';

export const ACADEMIA_PROFILE = 'https://ku-dk.academia.edu/AntonEbsen';

/**
 * SSRN's author page. Link-only, like ResearchGate and Academia.edu: 403 to every
 * automated request, and no API.
 *
 * Its robots.txt separately disallows GPTBot, ChatGPT-User and Google-Extended —
 * an AI-crawler block rather than a general one. It does not affect linking, but it
 * is a clear enough statement about automated reading to be worth recording next to
 * the URL rather than discovering again later.
 */
export const SSRN_PROFILE = 'https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=12924368';

/** ResearchGate's brand teal, for the profile chip. Not a site token. */
export const RESEARCHGATE_TEAL = '#00CCBB';

/**
 * Google Blue 300, not the primary #4285F4.
 *
 * The primary measures 4.55:1 against the raw --card token and only 3.48:1 on the
 * backdrop the chip actually sits on — a 10% tint over a white/5 glass card, which
 * composites lighter than the token. That is below AA, and it is the same trap
 * src/components/ui/Pill.astro documents after a chip measured 4.26:1 the same way.
 * The a11y sweep did not catch it because the chip only renders once a collaborator
 * is clicked, so axe never reaches it. This lighter step measures 5.89:1.
 */
export const SCHOLAR_BLUE = '#8AB4F8';
