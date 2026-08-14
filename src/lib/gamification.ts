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

    // The models — changing an assumption and watching the answer move.
    { id: 'assize',           icon: 'fa-solid fa-sliders',           xp: 150 },
    { id: 'variorum',         icon: 'fa-solid fa-chart-simple',      xp: 200 },
    { id: 'stemma',           icon: 'fa-solid fa-diagram-project',   xp: 100 },

    // Leaving a trace in the record.
    { id: 'attestation',      icon: 'fa-solid fa-signature',         xp: 250 },
    { id: 'petition',         icon: 'fa-solid fa-scroll',            xp: 250 },

    // Hidden, and the pilgrimage.
    { id: 'watermark',        icon: 'fa-solid fa-droplet',           xp: 500 },
    { id: 'pilgrims_burden',  icon: 'fa-solid fa-weight-hanging',    xp: 200 },

    // Things built to be found, rather than hooks onto what already existed.
    { id: 'sortetryk',        icon: 'fa-solid fa-stamp',             xp: 300 },
    { id: 'anathema',         icon: 'fa-solid fa-hand-fist',         xp: 300 },
    { id: 'manicule',         icon: 'fa-solid fa-hand-point-right',  xp: 150 },
    { id: 'sortes',           icon: 'fa-solid fa-dice',              xp: 150 },

    // Not rendered until earned — see `hidden` above.
    { id: 'apocryphon',       icon: 'fa-solid fa-key',               xp: 500, hidden: true }
];

/**
 * Marks required for each guild rank (Apprentice … Chancellor of the Exchequer).
 *
 * Explicit rather than a divisor. The whole ledger is worth 7,091 marks, so the
 * original `Math.floor(xp / 1000) + 1` topped out well below the end of the list
 * and the last rank was unreachable — nobody could ever see it.
 *
 * `void_walker` alone is 666 of those marks and requires finding a 404, so the
 * ceiling for a visitor who never does is 6,425: the second-highest rank is
 * attainable without it, the highest deliberately is not. That invariant is
 * asserted in src/i18n/ledger.test.ts, and it constrains the top threshold to
 * the range (6425, 7091] — re-check it if any entry's marks change.
 *
 * Thresholds are only ever appended to. Raising an existing one would demote
 * returning visitors, since `getGameState` recomputes rank from stored marks —
 * which is why adding entries adds a rank rather than restretching the ladder.
 *
 * The ladder turns at the end: apprentice through the guild, then the treasury,
 * and finally the keeper of the records — which is what a ledger is for.
 */
export const RANK_THRESHOLDS = [0, 400, 1000, 1900, 2800, 3900, 5200, 6600];

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
