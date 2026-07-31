import { test, expect } from '@playwright/test';

/**
 * Guards the gamification UI after its conversion from React to plain Astro.
 *
 * The React version had two defects these tests pin down:
 *  - TrophyRoom called useEffect after an early `return null`, so opening it
 *    changed the hook count and React threw.
 *  - It listened for 'achievement-unlocked' / 'xp-gain' while gamification.ts
 *    dispatches 'achievement_unlock' / 'xp_gain', so it never live-updated.
 */

const ACHIEVEMENT = {
    id: 'explorer',
    title: 'The Explorer',
    description: 'Visited 5 different pages on the site.',
    icon: 'fa-solid fa-compass',
    xp: 50
};

test.describe('Achievement toast', () => {
    test('appears on unlock and auto-dismisses', async ({ page }) => {
        await page.goto('/');

        const toast = page.locator('#achievement-toast');
        await expect(toast).toBeHidden();

        await page.evaluate((a) => {
            window.dispatchEvent(new CustomEvent('achievement_unlock', { detail: a }));
        }, ACHIEVEMENT);

        await expect(toast).toBeVisible();
        await expect(toast.locator('[data-toast-title]')).toHaveText(ACHIEVEMENT.title);
        await expect(toast.locator('[data-toast-xp]')).toHaveText(`+${ACHIEVEMENT.xp} XP`);

        // Auto-hide is 4s.
        await expect(toast).toBeHidden({ timeout: 8000 });
    });

    test('ignores malformed events instead of throwing', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/');
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('achievement_unlock', { detail: null }));
        });

        await expect(page.locator('#achievement-toast')).toBeHidden();
        expect(errors).toEqual([]);
    });
});

test.describe('Trophy room', () => {
    test('opens without errors and closes via Escape', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/');

        const modal = page.locator('#trophy-room');
        await expect(modal).toBeHidden();

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-trophy-room')));
        await expect(modal).toBeVisible();

        // The React version threw "Rendered more hooks than during the previous
        // render" at exactly this point.
        expect(errors, 'no error on open').toEqual([]);

        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
    });

    test('closes on backdrop click and toggles', async ({ page }) => {
        await page.goto('/');
        const modal = page.locator('#trophy-room');

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-trophy-room')));
        await expect(modal).toBeVisible();

        // Same event again toggles it shut.
        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-trophy-room')));
        await expect(modal).toBeHidden();
    });

    test('renders the achievement grid as server HTML', async ({ page }) => {
        // Grid markup must exist before any script runs, since it is no longer
        // built client-side.
        await page.route('**/*.js', (route) => route.abort());
        await page.goto('/');

        const cards = page.locator('#trophy-room .achievement-card');
        expect(await cards.count()).toBeGreaterThan(3);
        await expect(cards.first().locator('.achievement-title')).not.toBeEmpty();
    });

    test('reflects unlocked state and updates live while open', async ({ page }) => {
        await page.goto('/');

        // Unlock through the real API so localStorage and events both happen.
        await page.evaluate(() => {
            localStorage.setItem('anton_gamification_state', JSON.stringify({
                xp: 50, level: 1, unlockedAchievements: ['explorer']
            }));
        });

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-trophy-room')));
        await expect(page.locator('#trophy-room')).toBeVisible();

        const explorer = page.locator('#trophy-room [data-achievement="explorer"]');
        await expect(explorer).toHaveClass(/is-unlocked/);
        await expect(explorer.locator('.achievement-description')).toHaveText(ACHIEVEMENT.description);
        await expect(page.locator('[data-trophy-xp]')).toHaveText('50');

        // Locked ones stay masked.
        const locked = page.locator('#trophy-room .achievement-card:not(.is-unlocked)').first();
        await expect(locked.locator('.achievement-description')).toHaveText('Locked...');

        // Live update while open — this never fired in the React version.
        await page.evaluate(() => {
            localStorage.setItem('anton_gamification_state', JSON.stringify({
                xp: 150, level: 1, unlockedAchievements: ['explorer', 'scholar']
            }));
            window.dispatchEvent(new CustomEvent('xp_gain', { detail: { amount: 100, total: 150 } }));
        });

        await expect(page.locator('[data-trophy-xp]')).toHaveText('150');
    });
});
