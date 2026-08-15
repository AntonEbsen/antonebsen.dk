/**
 * The Ledger — entry definitions and persisted state.
 *
 * This module is imported by ~9 client <script> blocks, so it deliberately
 * carries no display text: titles and descriptions live in `src/i18n/ledger.ts`
 * and are handed to the client as JSON data attributes by the components that
 * render them. Keeping them out of here means the client bundle doesn't ship
 * all three languages on every page, and the language is chosen per request
 * rather than frozen at build time.
 */

export interface Achievement {
    id: string;
    icon: string; // FontAwesome class
    xp: number;   // stored as xp, displayed as "marks" — see GameState below
    /**
     * Not listed in the book until it has been earned.
     *
     * It still counts toward the total and the tally, so the ledger reads
     * "29 of 35 entered" while showing 34 folios. That discrepancy is the only
     * clue there is — an apocryphon is found by noticing the account does not
     * balance, which is how you would find one in a real archive.
     */
    hidden?: boolean;
}
// There was an `unlockedAt?: number` here that nothing ever wrote. Worse than
// dead: ACHIEVEMENTS is a module-level constant and the object handed to the
// UNLOCK event *is* that same object, so stamping a time onto it would have
// mutated the shared definition for every consumer. Dates live in
// GameState.enrolledAt instead, keyed by id.

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'explorer',         icon: 'fa-solid fa-compass',           xp: 50  },
    { id: 'scholar',          icon: 'fa-solid fa-book-open-reader',  xp: 100 },
    { id: 'economist',        icon: 'fa-solid fa-scale-balanced',    xp: 150 },
    { id: 'recruiter',        icon: 'fa-solid fa-file-signature',    xp: 200 },
    { id: 'quiz_novice',      icon: 'fa-solid fa-graduation-cap',    xp: 100 },
    { id: 'easter_egg',       icon: 'fa-solid fa-feather-pointed',   xp: 500 },
    { id: 'globetrotter',     icon: 'fa-solid fa-earth-europe',      xp: 75  },
    { id: 'timetraveler',     icon: 'fa-solid fa-hourglass-half',    xp: 75  },
    { id: 'void_walker',      icon: 'fa-solid fa-dragon',            xp: 666 },
    { id: 'polyglot',         icon: 'fa-solid fa-language',          xp: 200 },
    { id: 'hacker',           icon: 'fa-solid fa-pen-nib',           xp: 150 },
    { id: 'night_owl',        icon: 'fa-solid fa-moon',              xp: 100 },
    { id: 'prompt_engineer',  icon: 'fa-solid fa-comments',          xp: 150 },
    { id: 'data_miner',       icon: 'fa-solid fa-magnifying-glass',  xp: 100 },
    { id: 'social_butterfly', icon: 'fa-solid fa-share-nodes',       xp: 150 },
    { id: 'speed_demon',      icon: 'fa-solid fa-horse',             xp: 300 },
    { id: 'pixel_perfect',    icon: 'fa-solid fa-ruler-combined',    xp: 100 },
    { id: 'speaker',          icon: 'fa-solid fa-bullhorn',          xp: 100 },

    // The scholarly apparatus — what someone reading the work does, rather than
    // what someone browsing it does.
    { id: 'reckoning',        icon: 'fa-solid fa-calculator',        xp: 250 },
    { id: 'colophon',         icon: 'fa-solid fa-quote-right',       xp: 150 },
    { id: 'gloss',            icon: 'fa-solid fa-note-sticky',       xp: 75  },
    { id: 'visitation',       icon: 'fa-solid fa-clipboard-check',   xp: 150 },
    { id: 'explicit',         icon: 'fa-solid fa-bookmark',          xp: 150 },
    { id: 'quire',            icon: 'fa-solid fa-layer-group',       xp: 250 },
    { id: 'collatio',         icon: 'fa-solid fa-table-columns',     xp: 150 },
    { id: 'auscultatio',      icon: 'fa-solid fa-headphones',        xp: 100 },
    { id: 'vacat',            icon: 'fa-solid fa-strikethrough',     xp: 150 },

    // The models — changing an assumption and watching the answer move.
    { id: 'assize',           icon: 'fa-solid fa-sliders',           xp: 150 },
    { id: 'variorum',         icon: 'fa-solid fa-chart-simple',      xp: 200 },
    { id: 'stemma',           icon: 'fa-solid fa-diagram-project',   xp: 100 },
    { id: 'contra',           icon: 'fa-solid fa-right-left',        xp: 250 },

    // Leaving a trace in the record.
    { id: 'attestation',      icon: 'fa-solid fa-signature',         xp: 250 },
    { id: 'petition',         icon: 'fa-solid fa-scroll',            xp: 250 },

    // Hidden, and the pilgrimage.
    { id: 'watermark',        icon: 'fa-solid fa-droplet',           xp: 500 },
    { id: 'pilgrims_burden',  icon: 'fa-solid fa-weight-hanging',    xp: 200 },
    { id: 'compostela',       icon: 'fa-solid fa-person-hiking',     xp: 200 },

    // Things built to be found, rather than hooks onto what already existed.
    { id: 'sortetryk',        icon: 'fa-solid fa-stamp',             xp: 300 },
    { id: 'anathema',         icon: 'fa-solid fa-hand-fist',         xp: 300 },
    { id: 'manicule',         icon: 'fa-solid fa-hand-point-right',  xp: 150 },
    { id: 'sortes',           icon: 'fa-solid fa-dice',              xp: 150 },
    { id: 'quietus',          icon: 'fa-solid fa-file-circle-check', xp: 300 },

    // Compounds. These have no trigger of their own — they are earned by doing
    // two things the book already records, and are resolved from stored state by
    // `checkCompoundAchievements` below. Nothing new had to be built for them.
    { id: 'lectio_difficilior', icon: 'fa-solid fa-glasses',         xp: 300 },
    { id: 'absolutio',        icon: 'fa-solid fa-hands-praying',     xp: 250 },
    { id: 'brought_forward',  icon: 'fa-solid fa-angles-right',      xp: 200 },

    // Not rendered until earned — see `hidden` above.
    { id: 'apocryphon',       icon: 'fa-solid fa-key',               xp: 500, hidden: true }
];

/**
 * There is deliberately no entry anywhere near /modgang-og-maalrettethed.
 *
 * That page is an account of childhood epilepsy, brain damage and dyslexia. A
 * wax seal sliding in over it, congratulating the reader for having finished,
 * would be the one place on this site where the joke is actively wrong. Leave
 * it unhooked.
 */

/**
 * Marks required for each guild rank (Apprentice … Historiographer Royal).
 *
 * Explicit rather than a divisor. The whole ledger is worth 9,241 marks, so the
 * original `Math.floor(xp / 1000) + 1` topped out well below the end of the list
 * and the last rank was unreachable — nobody could ever see it.
 *
 * `void_walker` alone is 666 of those marks and requires finding a 404, so the
 * ceiling for a visitor who never does is 8,575: the second-highest rank is
 * attainable without it, the highest deliberately is not. That invariant is
 * asserted in src/i18n/ledger.test.ts, and it constrains the top threshold to
 * the range (8575, 9241] — re-check it if any entry's marks change.
 *
 * Thresholds are only ever appended to. Raising an existing one would demote
 * returning visitors, since `getGameState` recomputes rank from stored marks —
 * which is why adding entries adds a rank rather than restretching the ladder.
 * The ninth was appended for exactly that reason: the ten entries added 2,150
 * marks, which pushed the no-404 ceiling past the old top threshold of 6,600
 * and would otherwise have handed the final rank out for free.
 *
 * The ladder turns at the end: apprentice through the guild, then the treasury,
 * then the keeper of the records — which is what a ledger is for — and last the
 * one who writes history out of it, which is what the rest of the site is.
 */
export const RANK_THRESHOLDS = [0, 400, 1000, 1900, 2800, 3900, 5200, 6600, 8800];

/** 1-based rank for a given mark total, clamped to the table. */
export function rankFor(xp: number): number {
    const safe = Number.isFinite(xp) ? xp : 0;
    let rank = 1;
    for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
        if (safe >= RANK_THRESHOLDS[i]) rank = i + 1;
    }
    return rank;
}

/** Progress toward the next rank, 0–1. Returns 1 at the top rank. */
export function rankProgress(xp: number): number {
    const safe = Number.isFinite(xp) ? xp : 0;
    const rank = rankFor(safe);
    if (rank >= RANK_THRESHOLDS.length) return 1;

    const floor = RANK_THRESHOLDS[rank - 1];
    const ceiling = RANK_THRESHOLDS[rank];
    return Math.min(1, Math.max(0, (safe - floor) / (ceiling - floor)));
}

const STORAGE_KEY = 'anton_gamification_state';

export interface GameState {
    /**
     * Kept as `xp`, not renamed to `marks`, on purpose. Existing visitors have
     * `{"xp": 1450, …}` in localStorage; a renamed field would read undefined,
     * `state.marks += n` would evaluate to NaN, and NaN would then be written
     * back with no way to recover. The rename is presentational only.
     */
    xp: number;
    level: number;
    unlockedAchievements: string[]; // IDs
    /**
     * When each entry was made, keyed by id. A parallel map rather than a
     * richer shape for `unlockedAchievements`, because that array is read by
     * five call sites including an is:inline script that cannot import — and by
     * whatever version of the site a returning visitor last ran. Old saves
     * simply have no dates; their rows render undated.
     */
    enrolledAt: Record<string, number>;
}

function initialState(): GameState {
    return { xp: 0, level: 1, unlockedAchievements: [], enrolledAt: {} };
}

/** Keep only finite numeric timestamps, and reject an array masquerading as a map. */
function readDates(raw: unknown): Record<string, number> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    return Object.fromEntries(
        Object.entries(raw as Record<string, unknown>)
            .map(([id, at]) => [id, Number(at)] as const)
            .filter(([, at]) => Number.isFinite(at))
    );
}

// Event Bus for UI updates
export const GAME_EVENTS = {
    UNLOCK: 'achievement_unlock',
    XP_GAIN: 'xp_gain'
};

/**
 * Read persisted state.
 *
 * Returns a fresh object every time. The previous version handed back a shared
 * module-level constant, which `unlockAchievement` then push()ed into — so the
 * "empty" state accumulated ids for the lifetime of the module. Harmless while
 * this was browser-only, but /ledger renders on the server too.
 *
 * A malformed value is discarded rather than thrown: this runs during module
 * evaluation on every page, so one bad localStorage entry would otherwise take
 * down the whole site for that visitor with no way out.
 */
export function getGameState(): GameState {
    if (typeof localStorage === 'undefined') return initialState();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return initialState();

        const parsed = JSON.parse(stored);
        const xp = Number(parsed?.xp);

        return {
            xp: Number.isFinite(xp) ? xp : 0,
            level: rankFor(Number.isFinite(xp) ? xp : 0),
            unlockedAchievements: Array.isArray(parsed?.unlockedAchievements)
                ? parsed.unlockedAchievements.filter((id: unknown) => typeof id === 'string')
                : [],
            enrolledAt: readDates(parsed?.enrolledAt)
        };
    } catch {
        return initialState();
    }
}

/**
 * Discharge the account.
 *
 * Exported rather than letting the ledger component reach for the key itself:
 * STORAGE_KEY appears in exactly one other place (the is:inline pre-paint pass,
 * which cannot import), and a third copy is how they drift apart.
 *
 * The companion keys are left alone on purpose. `anton_scriptorium`,
 * `anton_manicules`, `anton_collatio`, `anton_quires`, `camino_stages` and
 * `visited_langs` are not the account — settling the account should not turn off
 * a reading mode the visitor switched on, or throw away their margin marks.
 */
export function clearGameState() {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Private mode. Nothing was persisted to begin with.
    }
}

export function saveGameState(state: GameState) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode / quota. Progress is cosmetic; losing it is not worth throwing.
    }
}

export function unlockAchievement(id: string) {
    const state = getGameState();
    if (state.unlockedAchievements.includes(id)) return; // Already enrolled

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    // Update State
    state.unlockedAchievements.push(id);
    state.enrolledAt[id] = Date.now();
    state.xp += achievement.xp;
    state.level = rankFor(state.xp);

    saveGameState(state);

    // Dispatch Event for Toasts. Carries no text — the toast resolves copy by id.
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.UNLOCK, {
            detail: achievement
        }));
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.XP_GAIN, {
            detail: { amount: achievement.xp, total: state.xp }
        }));
    }

    // Last, so a compound's toast queues behind the entry that completed it.
    checkCompoundAchievements();
}

/**
 * Entries earned by holding two others, resolved from stored state.
 *
 * Called at the end of `unlockAchievement`, which makes this re-entrant — but
 * only to depth two: the recursive call lands on the `includes` guard at the top
 * of `unlockAchievement` the moment the compound is already held, and a compound
 * is never itself a precondition of another compound.
 *
 * Also called on page load from BaseLayout, so a visitor who already held both
 * halves when this shipped is not made to earn something unrelated first.
 */
export function checkCompoundAchievements() {
    const { unlockedAchievements: held, enrolledAt } = getGameState();

    // The Absolution: cursed for copying without the source, then came back for
    // the citation. Order is the joke, so it is checked — but only when both
    // dates exist. Saves written before `enrolledAt` have no timestamps at all,
    // and a visitor who earned both last year should not be locked out for it.
    if (held.includes('anathema') && held.includes('colophon')) {
        const cursed = enrolledAt.anathema;
        const cited = enrolledAt.colophon;
        const inOrder = cursed === undefined || cited === undefined || cursed < cited;
        if (inOrder) unlockAchievement('absolutio');
    }
}

/**
 * Came back to the book after a week away.
 *
 * Measured from the earliest entry rather than a new "first seen" key: the
 * timestamps are already in `enrolledAt`, and a visitor who has never earned
 * anything has no book to come back to.
 */
export function checkBroughtForwardAchievement() {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const stamps = Object.values(getGameState().enrolledAt);
    if (!stamps.length) return;

    if (Date.now() - Math.min(...stamps) >= WEEK_MS) {
        unlockAchievement('brought_forward');
    }
}

/** All four stages of the Camino section. Mirrors checkPolyglotAchievement. */
export function checkCompostelaAchievement(stage: string) {
    if (typeof localStorage === 'undefined') return;

    try {
        let stages = JSON.parse(localStorage.getItem('camino_stages') || '[]');
        if (!Array.isArray(stages)) stages = [];

        if (!stages.includes(stage)) {
            stages.push(stage);
            localStorage.setItem('camino_stages', JSON.stringify(stages));
        }

        if (['way', 'route', 'prep', 'culture'].every(s => stages.includes(s))) {
            unlockAchievement('compostela');
        }
    } catch {
        // localStorage unavailable or corrupt — skip silently.
    }
}

/**
 * The Collation: one piece read in two tongues.
 *
 * Keyed by slug rather than by path, because the same post lives at /blog/x,
 * /en/blog/x and /de/blog/x — the whole point is recognising them as one text.
 */
export function checkCollatioAchievement(slug: string, lang: string) {
    if (typeof localStorage === 'undefined' || !slug) return;

    try {
        const raw = JSON.parse(localStorage.getItem('anton_collatio') || '{}');
        const seen: Record<string, string[]> =
            raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

        const langs = Array.isArray(seen[slug]) ? seen[slug] : [];
        if (!langs.includes(lang)) {
            langs.push(lang);
            seen[slug] = langs;
            localStorage.setItem('anton_collatio', JSON.stringify(seen));
        }

        if (langs.length >= 2) unlockAchievement('collatio');
    } catch {
        // localStorage unavailable or corrupt — skip silently.
    }
}

/**
 * The Quire: every part of one series read to the end.
 *
 * `total` comes from the page rather than from a count here, because the blog
 * lives in a content collection this module cannot reach from a client bundle.
 * Counting finished slugs rather than comparing seriesOrder values also means a
 * wrong order field cannot make a series unfinishable.
 */
export function checkQuireAchievement(series: string, total: number, slug: string) {
    if (typeof localStorage === 'undefined' || !series || !slug) return;
    if (!Number.isFinite(total) || total < 1) return;

    try {
        const raw = JSON.parse(localStorage.getItem('anton_quires') || '{}');
        const read: Record<string, string[]> =
            raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

        const slugs = Array.isArray(read[series]) ? read[series] : [];
        if (!slugs.includes(slug)) {
            slugs.push(slug);
            read[series] = slugs;
            localStorage.setItem('anton_quires', JSON.stringify(read));
        }

        if (slugs.length >= total) unlockAchievement('quire');
    } catch {
        // localStorage unavailable or corrupt — skip silently.
    }
}

export function checkPageVisitAchievement() {
    // Simple page visit counter in session storage
    if (typeof sessionStorage === 'undefined') return;

    try {
        let visited = JSON.parse(sessionStorage.getItem('visited_pages') || '[]');
        if (!Array.isArray(visited)) visited = [];

        const current = window.location.pathname;

        if (!visited.includes(current)) {
            visited.push(current);
            sessionStorage.setItem('visited_pages', JSON.stringify(visited));
        }

        if (visited.length >= 5) {
            unlockAchievement('explorer');
        }
    } catch {
        // sessionStorage unavailable or corrupt — skip silently.
    }
}

export function checkPolyglotAchievement() {
    if (typeof localStorage === 'undefined') return;

    try {
        // Store array of visited languages
        let langs = JSON.parse(localStorage.getItem('visited_langs') || '[]');
        if (!Array.isArray(langs)) langs = [];

        const currentLang = document.documentElement.lang || 'en';

        if (!langs.includes(currentLang)) {
            langs.push(currentLang);
            localStorage.setItem('visited_langs', JSON.stringify(langs));
        }

        if (langs.includes('da') && langs.includes('en') && langs.includes('de')) {
            unlockAchievement('polyglot');
        }
    } catch {
        // localStorage unavailable or corrupt — skip silently.
    }
}
