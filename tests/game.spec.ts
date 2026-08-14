import { test, expect } from '@playwright/test';

/**
 * Guards The Ledger — the entry log, its page, its modal and the ways in.
 *
 * Three classes of defect are pinned down here, all of which shipped:
 *  - The modal had no reachable entry point. Its only trigger was a palette row
 *    whose href was `#trophy-room`, a fragment pointing at a display:none node,
 *    so clicking it did nothing; and the first Enter press was swallowed because
 *    activeIndex sat at -1 while row 0 rendered as highlighted.
 *  - Copy was hardcoded English on a trilingual site.
 *  - The rank curve was Math.floor(xp/1000)+1 against the ledger's total, so
 *    the top rank could never be reached.
 */

const STORAGE_KEY = 'anton_gamification_state';

/** Entries currently defined in src/lib/gamification.ts. */
const ENTRY_COUNT = 35;
/** Of those, one is a secret folio that isn't listed until it is earned. */
const HIDDEN_COUNT = 1;

// Titles come from src/i18n/ledger.ts. `/` is Danish, `/en/*` English.
const DA = { title: 'Skelgangen', description: 'Gik skellet af: fem sider af godset opmålt.' };
const EN = { title: 'The Perambulation', description: 'Walked the bounds: five pages of the estate surveyed.' };

/** The event carries only {id, icon, xp} — the toast resolves wording by id. */
const UNLOCK_EVENT = { id: 'explorer', icon: 'fa-solid fa-compass', xp: 50 };

async function seed(
    page: import('@playwright/test').Page,
    xp: number,
    ids: string[],
    enrolledAt: Record<string, number> = {}
) {
    await page.evaluate(([key, state]) => {
        localStorage.setItem(key as string, JSON.stringify(state));
    }, [STORAGE_KEY, { xp, level: 1, unlockedAchievements: ids, enrolledAt }] as const);
}

async function unlockedIds(page: import('@playwright/test').Page): Promise<string[]> {
    return page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw).unlockedAchievements ?? [] : [];
    }, STORAGE_KEY);
}

test.describe('Seal toast', () => {
    test('appears on unlock and auto-dismisses', async ({ page }) => {
        await page.goto('/en');

        const toast = page.locator('#ledger-toast');
        await expect(toast).toBeHidden();

        await page.evaluate((a) => {
            window.dispatchEvent(new CustomEvent('achievement_unlock', { detail: a }));
        }, UNLOCK_EVENT);

        await expect(toast).toBeVisible();
        await expect(toast.locator('[data-toast-title]')).toHaveText(EN.title);
        await expect(toast.locator('[data-toast-marks]')).toHaveText(`${UNLOCK_EVENT.xp} marks`);

        // Auto-hide is 4s.
        await expect(toast).toBeHidden({ timeout: 8000 });
    });

    test('speaks the language of the page it appears on', async ({ page }) => {
        await page.goto('/');

        await page.evaluate((a) => {
            window.dispatchEvent(new CustomEvent('achievement_unlock', { detail: a }));
        }, UNLOCK_EVENT);

        await expect(page.locator('#ledger-toast [data-toast-title]')).toHaveText(DA.title);
        await expect(page.locator('#ledger-toast [data-toast-marks]')).toHaveText(`${UNLOCK_EVENT.xp} mark`);
    });

    test('ignores malformed events and unknown ids instead of throwing', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/');
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('achievement_unlock', { detail: null }));
            // The AI chat can emit an arbitrary id through its <<<UNLOCK>>> directive.
            window.dispatchEvent(new CustomEvent('achievement_unlock', {
                detail: { id: 'no_such_entry', icon: 'fa-solid fa-x', xp: 1 }
            }));
        });

        await expect(page.locator('#ledger-toast')).toBeHidden();
        expect(errors).toEqual([]);
    });
});

test.describe('Ledger modal', () => {
    test('opens without errors and closes via Escape', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/');

        const modal = page.locator('#ledger-modal');
        await expect(modal).toBeHidden();

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-ledger')));
        await expect(modal).toBeVisible();

        // The React predecessor threw "Rendered more hooks than during the
        // previous render" at exactly this point.
        expect(errors, 'no error on open').toEqual([]);

        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
    });

    test('toggles shut on the same event', async ({ page }) => {
        await page.goto('/');
        const modal = page.locator('#ledger-modal');

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-ledger')));
        await expect(modal).toBeVisible();

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-ledger')));
        await expect(modal).toBeHidden();
    });

    test('renders its rows as server HTML', async ({ page }) => {
        // The rows must exist before any script runs — they are no longer built
        // client-side.
        await page.route('**/*.js', (route) => route.abort());
        await page.goto('/');

        const rows = page.locator('#ledger-modal [data-ledger-entry]');
        expect(await rows.count()).toBeGreaterThan(3);
        await expect(rows.first().locator('[data-ledger-title]')).not.toBeEmpty();
    });

    test('reflects enrolled state and updates live while open', async ({ page }) => {
        await page.goto('/en');
        await seed(page, 50, ['explorer']);

        await page.evaluate(() => window.dispatchEvent(new CustomEvent('toggle-ledger')));
        await expect(page.locator('#ledger-modal')).toBeVisible();

        const explorer = page.locator('#ledger-modal [data-ledger-entry="explorer"]');
        await expect(explorer).toHaveClass(/is-enrolled/);
        await expect(explorer.locator('[data-ledger-desc]')).toHaveText(EN.description);
        await expect(explorer.locator('[data-ledger-status]')).toHaveText('Enrolled');
        await expect(page.locator('#ledger-modal [data-ledger-marks]')).toHaveText('50');

        // Unmade entries show a blank folio rather than a greyed-out badge —
        // opacity/grayscale on muted text is what failed the contrast audit.
        const blank = page.locator('#ledger-modal [data-ledger-entry]:not(.is-enrolled)').first();
        await expect(blank.locator('[data-ledger-desc]')).toHaveText('This folio is blank.');
        await expect(blank.locator('[data-ledger-status]')).toHaveText('Not yet enrolled');

        // Live update while open — this never fired in the React version, which
        // listened for event names gamification.ts does not dispatch.
        await page.evaluate(() => {
            localStorage.setItem('anton_gamification_state', JSON.stringify({
                xp: 150, level: 1, unlockedAchievements: ['explorer', 'scholar']
            }));
            window.dispatchEvent(new CustomEvent('xp_gain', { detail: { amount: 100, total: 150 } }));
        });

        await expect(page.locator('#ledger-modal [data-ledger-marks]')).toHaveText('150');
    });
});

test.describe('Ledger page', () => {
    for (const [path, heading, firstEntry] of [
        ['/ledger', 'Hovedbogen', 'Skelgangen'],
        ['/en/ledger', 'The Ledger', 'The Perambulation'],
        ['/de/ledger', 'Das Hauptbuch', 'Der Grenzumgang']
    ] as const) {
        test(`${path} renders in its own language`, async ({ page }) => {
            const res = await page.goto(path);
            expect(res?.status()).toBe(200);

            await expect(page.locator('h1')).toHaveText(heading);
            await expect(
                page.locator('#ledger-page-book [data-ledger-entry="explorer"] [data-ledger-title]')
            ).toHaveText(firstEntry);
        });
    }

    test('renders the whole book without JavaScript', async ({ page }) => {
        await page.route('**/*.js', (route) => route.abort());
        await page.goto('/en/ledger');

        const rows = page.locator('#ledger-page-book [data-ledger-entry]');
        expect(await rows.count()).toBe(ENTRY_COUNT);
        // The secret folio ships in the markup but hidden, so a reader without
        // JavaScript sees the same book everyone else does.
        expect(
            await page.locator('#ledger-page-book [data-ledger-entry]:visible').count()
        ).toBe(ENTRY_COUNT - HIDDEN_COUNT);
    });

    test('dates enrolled rows, and leaves older entries undated', async ({ page }) => {
        await page.goto('/en');

        const when = new Date(2026, 7, 13).getTime(); // 13 August 2026
        // 'watermark' is enrolled but carries no date — the shape a save written
        // before dates were recorded still has.
        await seed(page, 550, ['explorer', 'watermark'], { explorer: when });

        await page.goto('/en/ledger');
        const book = page.locator('#ledger-page-book');

        const dated = book.locator('[data-ledger-entry="explorer"]');
        await expect(dated.locator('[data-ledger-date]')).toHaveText('xiii · viii · mmxxvi');
        // Roman read aloud is gibberish, so a real date sits beside it — spelled
        // out, because 'en' would otherwise render 8/13 against a day-month Roman.
        await expect(dated.locator('[data-ledger-date-plain]')).toHaveText('13 August 2026');
        await expect(dated.locator('[data-ledger-date]')).toHaveAttribute('aria-hidden', 'true');

        const undated = book.locator('[data-ledger-entry="watermark"]');
        await expect(undated).toHaveClass(/is-enrolled/);
        await expect(undated.locator('[data-ledger-date]')).toBeEmpty();
        await expect(undated.locator('[data-ledger-date-plain]')).toBeEmpty();
    });

    test('a save written before dates existed still loads', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/en');
        await page.evaluate((key) => {
            // No enrolledAt key at all — exactly what an existing visitor has.
            localStorage.setItem(key, JSON.stringify({
                xp: 1900, level: 4, unlockedAchievements: ['explorer', 'scholar']
            }));
        }, STORAGE_KEY);

        await page.goto('/en/ledger');

        await expect(page.locator('#ledger-page-book [data-ledger-rank]')).toHaveText('Alderman');
        await expect(page.locator('#ledger-page-book [data-ledger-marks]')).toHaveText('1900');
        await expect(page.locator('#ledger-page-book [data-ledger-entry="explorer"]')).toHaveClass(/is-enrolled/);
        expect(errors).toEqual([]);
    });

    test('paints saved progress before hydration, with no flash of zero', async ({ page }) => {
        // Seed on a page that shares the origin, then come back.
        await page.goto('/en');
        await seed(page, 1900, ['explorer', 'void_walker', 'easter_egg']);

        // Blocking scripts leaves only the is:inline pre-paint pass running.
        await page.route('**/*.js', (route) => route.abort());
        await page.goto('/en/ledger');

        const book = page.locator('#ledger-page-book');
        await expect(book.locator('[data-ledger-marks]')).toHaveText('1900');
        await expect(book.locator('[data-ledger-rank]')).toHaveText('Alderman');
        await expect(book.locator('[data-ledger-entry="explorer"]')).toHaveClass(/is-enrolled/);
    });

    test('the page and the modal do not collide', async ({ page }) => {
        // BaseLayout mounts the modal on /ledger too. Duplicate ids would be an
        // axe violation and would make every unscoped selector ambiguous.
        await page.goto('/en/ledger');

        const duplicates = await page.evaluate(() => {
            const ids = [...document.querySelectorAll('[id]')].map((e) => e.id).filter(Boolean);
            return ids.filter((id, i) => ids.indexOf(id) !== i);
        });
        expect(duplicates).toEqual([]);

        await expect(page.locator('[data-ledger-root]')).toHaveCount(2);
    });
});

test.describe('Guild ranks', () => {
    // Under the old Math.floor(xp/1000)+1 curve the top rank was unreachable,
    // which is the bug this pins down. Thresholds are only ever appended to, so
    // the 1,900 -> Alderman case doubles as proof that adding entries and ranks
    // never demoted anyone who was already there.
    const LADDER = [
        [0, 'Apprentice'],
        [400, 'Journeyman'],
        [1000, 'Master'],
        [1900, 'Alderman'],
        [2800, 'Master of the Mint'],
        [3900, 'Lord Treasurer'],
        [5200, 'Chancellor of the Exchequer'],
        [6600, 'Master of the Rolls']
    ] as const;

    for (const [marks, rank] of LADDER) {
        test(`${marks} marks reads as ${rank}`, async ({ page }) => {
            await page.goto('/en');
            await seed(page, marks, []);
            await page.goto('/en/ledger');

            await expect(page.locator('#ledger-page-book [data-ledger-rank]')).toHaveText(rank);
        });
    }

    test('the top rank is reachable by completing the book', async ({ page }) => {
        await page.goto('/en');

        const totalMarks = await page.evaluate(() =>
            Number(document.querySelector('#ledger-modal [data-ledger-progress]')?.getAttribute('aria-valuemax'))
        );

        await seed(page, totalMarks, []);
        await page.goto('/en/ledger');
        await expect(page.locator('#ledger-page-book [data-ledger-rank]')).toHaveText('Master of the Rolls');
    });

    test('corrupt saved state does not break the page', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto('/en');
        await page.evaluate((key) => localStorage.setItem(key, '{not json'), STORAGE_KEY);
        await page.goto('/en/ledger');

        // getGameState runs during module evaluation on every page of the site,
        // so a throw here would take the whole site down for that visitor.
        await expect(page.locator('#ledger-page-book [data-ledger-rank]')).toHaveText('Apprentice');
        await expect(page.locator('#ledger-page-book [data-ledger-marks]')).toHaveText('0');
        expect(errors).toEqual([]);
    });
});

test.describe('Ways in', () => {
    test('the nav links to the ledger', async ({ page }) => {
        await page.goto('/en');

        const link = page.locator('nav a[href="/en/ledger"]').first();
        await expect(link).toHaveAttribute('href', '/en/ledger');

        const res = await page.request.get('/en/ledger');
        expect(res.status()).toBe(200);
    });

    test('the footer links to the ledger', async ({ page }) => {
        await page.goto('/en');
        await expect(page.locator('footer a[href="/en/ledger"]')).toHaveCount(1);
    });

    test('clicking the palette quick action opens the modal', async ({ page }) => {
        await page.goto('/en');

        await page.keyboard.press('ControlOrMeta+k');
        const tile = page.locator('.palette-item[data-event="toggle-ledger"]');
        await expect(tile).toBeVisible();

        // This is the regression: the tile used to be <a href="#trophy-room">
        // with no click handler, so a mouse click silently did nothing.
        await tile.click();

        await expect(page.locator('#ledger-modal')).toBeVisible();
        await expect(page.locator('#command-palette')).not.toHaveClass(/is-open/);
    });

    test('the first Enter press opens the highlighted search result', async ({ page }) => {
        await page.goto('/en');

        await page.keyboard.press('ControlOrMeta+k');
        await page.locator('#palette-input').fill('ledger');

        // Row 0 renders with is-active styling; activeIndex used to stay at -1,
        // so this first Enter was a no-op against a visibly highlighted row.
        await expect(page.locator('#palette-results-list .palette-item.is-active')).toBeVisible();
        await page.keyboard.press('Enter');

        await expect(page).toHaveURL(/\/en\/ledger$/);
    });

    test('the navbar search dropdown reaches the ledger', async ({ page }) => {
        await page.goto('/en');

        // These rows render straight from the search index. They pointed at
        // #trophy-room, so every one of them was a dead link.
        const index = await page.request.get('/search-index.json');
        const rows = (await index.json()) as { title: string; url: string; lang: string }[];

        const ledgerRows = rows.filter((r) => r.url.endsWith('/ledger'));
        expect(ledgerRows).toHaveLength(3);
        expect(ledgerRows.every((r) => !r.url.startsWith('#'))).toBe(true);

        for (const row of ledgerRows) {
            const res = await page.request.get(row.url);
            expect(res.status(), `${row.lang} → ${row.url}`).toBe(200);
        }
    });
});

test.describe('Entries that could not be earned', () => {
    test('walking five pages enrolls the perambulation', async ({ page }) => {
        // checkPageVisitAchievement was exported and never called, so this entry
        // was unobtainable except by the AI chat handing it out.
        await page.goto('/en');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        for (const path of ['/en/about', '/en/portfolio', '/en/blog', '/en/cv', '/en/contact']) {
            await page.goto(path);
        }

        const unlocked = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).unlockedAchievements : [];
        }, STORAGE_KEY);

        expect(unlocked).toContain('explorer');
    });

    test('two minutes on a post enrolls lectio, but only while visible', async ({ page }) => {
        // The description promised a two-minute timer that was never written.
        await page.clock.install();
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        await page.clock.fastForward('02:05');

        const unlocked = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).unlockedAchievements : [];
        }, STORAGE_KEY);

        expect(unlocked).toContain('scholar');
    });

    test('reading to the end enrols the explicit', async ({ page }) => {
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        // Repeatedly, because client:visible islands hydrate as they come into
        // view and the document keeps growing under a single jump to the bottom.
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(200);
        }

        await expect.poll(() => unlockedIds(page)).toContain('explicit');
    });

    test('a page too short to scroll does not enrol the explicit', async ({ page }) => {
        // docHeight = scrollHeight - innerHeight goes <= 0 when the content fits,
        // which made `scrolled` NaN or Infinity — and Infinity >= 95 is true, so
        // without the guard this enrolled itself the moment a scroll event fired.
        await page.setViewportSize({ width: 1280, height: 4000 });
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        const shortEnough = await page.evaluate(() => {
            document.body.style.height = '10px';
            document.documentElement.style.height = '10px';
            window.dispatchEvent(new Event('scroll'));
            return document.documentElement.scrollHeight - window.innerHeight <= 0;
        });

        expect(shortEnough, 'the page should be shorter than the viewport').toBe(true);
        expect(await unlockedIds(page)).not.toContain('explicit');
    });

    test('the chameleon enrols the watermark', async ({ page }) => {
        // ?company= is linked from nowhere, which is the point of the entry.
        // Chameleon renders before BaseLayout assigns window.unlockAchievement,
        // so this also proves it imports rather than reading the global.
        await page.goto('/en');
        await page.evaluate(() => localStorage.clear());

        await page.goto('/en?company=Lego');
        await expect.poll(() => unlockedIds(page)).toContain('watermark');
    });

    test('a plain visit does not enrol the watermark', async ({ page }) => {
        await page.goto('/en');
        await page.evaluate(() => localStorage.clear());
        await page.goto('/en/about');

        expect(await unlockedIds(page)).not.toContain('watermark');
    });

    test('an empty rucksack does not enrol the pilgrim, but a packed one does', async ({ page }) => {
        // updateWeight() runs on load and an empty pack weighs nothing, so it
        // clears any limit — without the guard this fired for every visitor.
        await page.goto('/camino/prep');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const advice = page.locator('#weight-advice');
        await expect(advice).toContainText('🟢');
        expect(await unlockedIds(page), 'load alone must not enrol').not.toContain('pilgrims_burden');

        // The real input is opacity:0 and absolutely positioned behind a styled
        // .checkmark, so the label is what a visitor actually clicks.
        await page.locator('label.item-checkbox').first().click();
        await expect(page.locator('.weight-checkbox').first()).toBeChecked();

        // One item is nowhere near a tenth of body weight, so this stays green —
        // the difference from the load case is purely that a person did it.
        await expect(advice).toContainText('🟢');
        await expect.poll(() => unlockedIds(page)).toContain('pilgrims_burden');
    });

    test('a hidden tab does not count as reading', async ({ page }) => {
        await page.clock.install();
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => {
            localStorage.clear();
            Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await page.clock.fastForward('05:00');

        const unlocked = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).unlockedAchievements : [];
        }, STORAGE_KEY);

        expect(unlocked).not.toContain('scholar');
    });
});
