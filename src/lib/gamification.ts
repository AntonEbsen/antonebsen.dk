// import { type CollectionEntry } from 'astro:content'; // Removed to avoid server-side dependency in client code


export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // FontAwesome class or emoji
    xp: number;
    unlockedAt?: number; // Timestamp
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'explorer',
        title: 'The Explorer',
        description: 'Visited 5 different pages on the site.',
        icon: 'fa-solid fa-compass',
        xp: 50
    },
    {
        id: 'scholar',
        title: 'The Scholar',
        description: 'Read a blog post for more than 2 minutes.',
        icon: 'fa-solid fa-book-open-reader',
        xp: 100
    },
    {
        id: 'economist',
        title: 'The Economist',
        description: 'Asked the AI about Taylor Rules or Monetary Policy.',
        icon: 'fa-solid fa-chart-line',
        xp: 150
    },
    {
        id: 'recruiter',
        title: 'Headhunter',
        description: 'Downloaded the CV or viewed the Resume page.',
        icon: 'fa-solid fa-briefcase',
        xp: 200
    },
    {
        id: 'quiz_novice',
        title: 'Quiz Novice',
        description: 'Completed your first AI quiz.',
        icon: 'fa-solid fa-graduation-cap',
        xp: 100
    },
    {
        id: 'easter_egg',
        title: 'Konami Code',
        description: 'You found the secret code! (⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️BA)',
        icon: 'fa-solid fa-gamepad',
        xp: 500
    },
    {
        id: 'globetrotter',
        title: 'The Globetrotter',
        description: 'Spun the 3D globe in the Contact section.',
        icon: 'fa-solid fa-earth-europe',
        xp: 75
    },
    {
        id: 'timetraveler',
        title: 'Time Traveler',
        description: 'Explored the Career Timeline.',
        icon: 'fa-solid fa-hourglass-half',
        xp: 75
    },
    {
        id: 'void_walker',
        title: 'Void Walker',
        description: 'Stared into the abyss (404 Page).',
        icon: 'fa-solid fa-ghost',
        xp: 666
    },
    {
        id: 'polyglot',
        title: 'The Polyglot',
        description: 'Viewed the site in all 3 languages.',
        icon: 'fa-solid fa-language',
        xp: 200
    }
];

const STORAGE_KEY = 'anton_gamification_state';

interface GameState {
    xp: number;
    level: number;
    unlockedAchievements: string[]; // IDs
}

const INITIAL_STATE: GameState = {
    xp: 0,
    level: 1,
    unlockedAchievements: []
};

// Event Bus for UI updates
export const GAME_EVENTS = {
    UNLOCK: 'achievement_unlock',
    XP_GAIN: 'xp_gain'
};

export function getGameState(): GameState {
    if (typeof localStorage === 'undefined') return INITIAL_STATE;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_STATE;
}

export function saveGameState(state: GameState) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function unlockAchievement(id: string) {
    const state = getGameState();
    if (state.unlockedAchievements.includes(id)) return; // Already unlocked

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    // Update State
    state.unlockedAchievements.push(id);
    state.xp += achievement.xp;
    state.level = Math.floor(state.xp / 1000) + 1; // Simple level curve

    saveGameState(state);

    // Dispatch Event for Toasts
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.UNLOCK, {
            detail: achievement
        }));
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.XP_GAIN, {
            detail: { amount: achievement.xp, total: state.xp }
        }));
    }

    console.log(`🏆 Achievement Unlocked: ${achievement.title}`);
}

export function checkPageVisitAchievement() {
    // Simple page visit counter in session storage
    if (typeof sessionStorage === 'undefined') return;

    let visited = JSON.parse(sessionStorage.getItem('visited_pages') || '[]');
    const current = window.location.pathname;

    if (!visited.includes(current)) {
        visited.push(current);
        sessionStorage.setItem('visited_pages', JSON.stringify(visited));
    }

    if (visited.length >= 5) {
        unlockAchievement('explorer');
    }
}

export function checkPolyglotAchievement() {
    if (typeof localStorage === 'undefined') return;

    // Store array of visited languages
    let langs = JSON.parse(localStorage.getItem('visited_langs') || '[]');
    const currentLang = document.documentElement.lang || 'en';

    if (!langs.includes(currentLang)) {
        langs.push(currentLang);
        localStorage.setItem('visited_langs', JSON.stringify(langs));
    }

    if (langs.includes('da') && langs.includes('en') && langs.includes('de')) {
        unlockAchievement('polyglot');
    }
}
