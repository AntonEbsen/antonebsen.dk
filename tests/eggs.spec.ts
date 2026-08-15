import { test, expect } from '@playwright/test';

/**
 * The entries that required building something rather than hooking something
 * that already existed.
 *
 * Most of what is asserted here is what each egg must *not* do — the copy still
 * reaching the clipboard, the navigation staying in Latin script, the trigger
 * not firing while someone types into a form, a full ledger surviving a stray
 * click on the one control that can destroy it. An easter egg that breaks the
 * site around it is just a bug with a nicer name.
 */

const STORAGE_KEY = 'anton_gamification_state';

async function unlockedIds(page: import('@playwright/test').Page): Promise<string[]> {
    return page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw).unlockedAchievements ?? [] : [];
    }, STORAGE_KEY);
}

async function marks(page: import('@playwright/test').Page): Promise<number> {
    return page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw).xp ?? 0 : 0;
    }, STORAGE_KEY);
}

/** Write a book directly, so a test does not have to earn its way to one. */
async function seed(
    page: import('@playwright/test').Page,
    xp: number,
    ids: string[],
    enrolledAt: Record<string, number> = {}
) {
    await page.evaluate(
        ([key, state]) => localStorage.setItem(key as string, JSON.stringify(state)),
        [STORAGE_KEY, { xp, level: 1, unlockedAchievements: ids, enrolledAt }] as const
    );
}

/** Type a word at the document, one key at a time, as the trigger expects. */
async function typeWord(page: import('@playwright/test').Page, word: string) {
    for (const ch of word) await page.keyboard.press(ch);
}

/**
 * Scroll to the bottom and keep doing it.
 *
 * A single jump is not enough: client:visible islands hydrate as they come into
 * view and the document keeps growing underneath. Same loop as game.spec.ts.
 */
async function readToTheEnd(page: import('@playwright/test').Page) {
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(200);
    }
}

/**
 * Open the discharge confirm, retrying until it actually opens.
 *
 * The button ships in the server HTML but its handler is attached by a deferred
 * module script, so a click in the first few milliseconds of the page lands on
 * an inert control. Real visitors hit the same window; they just click again.
 */
async function openDischarge(page: import('@playwright/test').Page) {
    const panel = page.locator('[data-discharge-confirm]');
    await expect
        .poll(async () => {
            await page.locator('[data-discharge-open]').click();
            return panel.isVisible();
        }, { timeout: 10_000 })
        .toBe(true);
}

test.describe('Scriptorium mode', () => {
    test('sets the page in Fraktur and long s, and puts it back exactly', async ({ page }) => {
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());

        const article = page.locator('article');
        const before = await article.textContent();
        const navBefore = await page.locator('nav').first().textContent();

        await typeWord(page, 'fraktur');

        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);
        await expect(article).toContainText('ſ');
        await expect.poll(() => unlockedIds(page)).toContain('sortetryk');

        // Navigation must stay in Latin script — it is the way out.
        expect(await page.locator('nav').first().textContent()).toBe(navBefore);

        // The bar is the documented exit, and is never itself transformed.
        const bar = page.locator('#scriptorium-bar');
        await expect(bar).toBeVisible();
        expect(await bar.textContent()).not.toContain('ſ');

        await bar.getByRole('button').click();

        await expect(page.locator('body')).not.toHaveClass(/scriptorium-active/);
        // Byte-identical, because the originals are kept rather than the
        // substitution being reversed — ſ is a real letter that could legitimately
        // appear in a source text.
        expect(await article.textContent()).toBe(before);
    });

    test('survives navigation once switched on', async ({ page }) => {
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());
        await typeWord(page, 'fraktur');
        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);

        await page.goto('/en/about');
        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);
    });

    test('ignores the word typed into a form field', async ({ page }) => {
        // Otherwise the guestbook flips the whole site mid-sentence.
        await page.goto('/en/guestbook');
        await page.evaluate(() => localStorage.clear());

        const field = page.locator('#g-message');
        await field.fill('');
        await field.click();
        await field.type('fraktur');

        await expect(page.locator('body')).not.toHaveClass(/scriptorium-active/);
        expect(await unlockedIds(page)).not.toContain('sortetryk');
    });
});

test.describe('Anathema', () => {
    test('curses a large copy without blocking it', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());

        await page.evaluate(() => {
            const article = document.querySelector('article')!;
            const range = document.createRange();
            range.selectNodeContents(article);
            const sel = document.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
        });

        const selected = await page.evaluate(() => document.getSelection()!.toString());
        expect(selected.length).toBeGreaterThan(200);

        await page.keyboard.press('ControlOrMeta+c');

        await expect(page.locator('#anathema')).toBeVisible();
        await expect.poll(() => unlockedIds(page)).toContain('anathema');

        // The whole point: it is a joke, not a lock.
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard.length).toBeGreaterThan(200);
    });

    test('ignores a short copy', async ({ page }) => {
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());

        await page.evaluate(() => {
            // Find a real text node: paragraphs now begin with the manicule button.
            const p = document.querySelector('article p')!;
            const text = [...p.childNodes].find(
                (n) => n.nodeType === Node.TEXT_NODE && (n.nodeValue?.trim().length ?? 0) > 20
            ) as Text;
            const range = document.createRange();
            range.setStart(text, 0);
            range.setEnd(text, 15);
            const sel = document.getSelection()!;
            sel.removeAllRanges();
            sel.addRange(range);
        });
        await page.keyboard.press('ControlOrMeta+c');

        await expect(page.locator('#anathema')).toBeHidden();
        expect(await unlockedIds(page)).not.toContain('anathema');
    });
});

test.describe('The Manicule', () => {
    test('marks a passage, keeps it, and is reachable by keyboard', async ({ page }) => {
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());

        const first = page.locator('.manicule').first();
        await expect(first).toHaveAttribute('aria-pressed', 'false');

        // A real button with a name, not a bare margin click-zone — a margin
        // strip is unreachable by keyboard, and this one is meant to be used.
        await expect(first).toHaveRole('button');
        await expect(first).toHaveAttribute('aria-label', /\(1\)$/);

        await first.click();
        await expect(first).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(() => unlockedIds(page)).toContain('manicule');

        await page.reload();
        await expect(page.locator('.manicule').first()).toHaveAttribute('aria-pressed', 'true');

        // And it toggles back off.
        await page.locator('.manicule').first().click();
        await expect(page.locator('.manicule').first()).toHaveAttribute('aria-pressed', 'false');
    });
});

test.describe('Sortes', () => {
    test('opens a real page, in the language you were reading', async ({ page }) => {
        await page.goto('/en/about');
        await page.evaluate(() => localStorage.clear());

        await page.keyboard.press('ControlOrMeta+k');
        await page.locator('.palette-item[data-event="ledger:sortes"]').click();

        await page.waitForURL((url) => url.pathname !== '/en/about');

        // Stays in English rather than dropping the reader into another language.
        expect(page.url()).toContain('/en/');
        expect(await unlockedIds(page)).toContain('sortes');
        await expect(page.locator('h1').first()).toBeVisible();
    });
});

test.describe('The Apocryphon', () => {
    test('is absent from the book until the account is questioned', async ({ page }) => {
        await page.goto('/en/ledger');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const rows = page.locator('#ledger-page-book [data-ledger-entry]');
        const visible = page.locator('#ledger-page-book [data-ledger-entry]:visible');

        // The tally counts it; the folios do not show it. That gap is the clue.
        const shown = await visible.count();
        const counted = await rows.count();
        expect(counted).toBe(shown + 1);
        await expect(page.locator('#ledger-page-book .ledger-progress__note')).toContainText(String(counted));

        await expect(page.locator('[data-ledger-entry="apocryphon"]').first()).toBeHidden();

        // Interrogate the sum that will not balance.
        await page.locator('#ledger-page-book [data-ledger-foot]').click();

        await expect(page.locator('#ledger-page-book [data-ledger-entry="apocryphon"]')).toBeVisible();
        expect(await unlockedIds(page)).toContain('apocryphon');
    });
});

test.describe('Discharging the account', () => {
    test('takes two steps, and the first one changes nothing', async ({ page }) => {
        await page.goto('/en/ledger');
        await seed(page, 1450, ['explorer', 'scholar', 'manicule']);
        await page.reload();

        const open = page.locator('[data-discharge-open]');
        const panel = page.locator('[data-discharge-confirm]');

        // Unlike the apocryphon, this one is meant to be found and meant to be
        // refused — a real button, a real name, a real focus ring.
        await expect(open).toHaveRole('button');
        await expect(panel).toBeHidden();

        await openDischarge(page);
        await expect(panel).toBeVisible();

        // The prompt says what is lost rather than being coy about it.
        await expect(page.locator('[data-discharge-prompt]')).toContainText('3 entries');
        await expect(page.locator('[data-discharge-prompt]')).toContainText('1450 marks');

        // Focus lands on Cancel, not on the confirm: two Enters in a row must
        // not be able to destroy a full book.
        await expect(page.locator('[data-discharge-no]')).toBeFocused();

        await page.locator('[data-discharge-no]').click();
        await expect(panel).toBeHidden();
        expect(await unlockedIds(page)).toEqual(['explorer', 'scholar', 'manicule']);
        expect(await marks(page)).toBe(1450);
    });

    test('settles the account and leaves exactly the one line', async ({ page }) => {
        await page.goto('/en/ledger');
        await seed(page, 1450, ['explorer', 'scholar', 'manicule']);
        await page.reload();

        await openDischarge(page);
        await page.locator('[data-discharge-yes]').click();

        // The book begins again with one line already in it.
        await expect.poll(() => unlockedIds(page)).toEqual(['quietus']);
        expect(await marks(page)).toBe(300);

        const book = page.locator('#ledger-page-book');
        await expect(book.locator('[data-ledger-entry="quietus"]')).toHaveClass(/is-enrolled/);
        await expect(book.locator('[data-ledger-entry="explorer"]')).not.toHaveClass(/is-enrolled/);
        await expect(book.locator('[data-ledger-rank]')).toHaveText('Apprentice');
    });

    test('leaves the reading modes alone', async ({ page }) => {
        // Settling the account is not the same as undoing what someone chose to
        // switch on. Margin marks and Fraktur are not the account.
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());
        await typeWord(page, 'fraktur');
        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);

        await page.goto('/en/ledger');
        await openDischarge(page);
        await page.locator('[data-discharge-yes]').click();
        await expect.poll(() => unlockedIds(page)).toEqual(['quietus']);

        await page.goto('/en/blog/gfc-part-1');
        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);
    });
});

test.describe('Vacat', () => {
    test('is enrolled by reading the cancelled folios through', async ({ page }) => {
        await page.goto('/anti-resume');
        await page.evaluate(() => localStorage.clear());

        expect(await unlockedIds(page)).not.toContain('vacat');

        await readToTheEnd(page);
        await expect.poll(() => unlockedIds(page)).toContain('vacat');
    });
});

test.describe('Lectio difficilior', () => {
    test('wants the whole piece read in blackletter, not just set in it', async ({ page }) => {
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        // Setting the page in Fraktur is the other entry, and is not enough.
        await typeWord(page, 'fraktur');
        await expect(page.locator('body')).toHaveClass(/scriptorium-active/);
        await expect.poll(() => unlockedIds(page)).toContain('sortetryk');
        expect(await unlockedIds(page)).not.toContain('lectio_difficilior');

        await readToTheEnd(page);

        await expect.poll(() => unlockedIds(page)).toContain('lectio_difficilior');
        // The plain reading is granted alongside it, not instead of it.
        expect(await unlockedIds(page)).toContain('explicit');
    });

    test('is not granted for reading in Latin script', async ({ page }) => {
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        await readToTheEnd(page);

        await expect.poll(() => unlockedIds(page)).toContain('explicit');
        expect(await unlockedIds(page)).not.toContain('lectio_difficilior');
    });
});

test.describe('The Quire', () => {
    test('is enrolled only once every part of the series has been read', async ({ page }) => {
        const parts = ['welfare-part-1', 'welfare-part-2', 'welfare-part-3'];

        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        for (const [i, slug] of parts.entries()) {
            await page.goto(`/en/blog/${slug}`);
            await readToTheEnd(page);

            if (i < parts.length - 1) {
                // Two thirds of a series is not a series.
                expect(await unlockedIds(page), `after ${slug}`).not.toContain('quire');
            }
        }

        await expect.poll(() => unlockedIds(page)).toContain('quire');
    });
});

test.describe('Auscultation', () => {
    test('is enrolled by having the piece read aloud', async ({ page }) => {
        // gfc-part-1 and ai-monetary-policy are the two posts with recordings.
        await page.goto('/en/blog/gfc-part-1');
        await page.evaluate(() => localStorage.clear());

        // The play control sits immediately after the <audio> element it drives.
        const play = page.locator('audio').locator('xpath=following-sibling::button').first();
        await play.waitFor({ state: 'visible' });

        expect(await unlockedIds(page)).not.toContain('auscultatio');

        await play.click();
        await expect.poll(() => unlockedIds(page)).toContain('auscultatio');
    });
});

test.describe('The Contra Entry', () => {
    test('wants the coefficient found on both sides of zero', async ({ page }) => {
        await page.goto('/models/rolling-window');
        await page.evaluate(() => localStorage.clear());

        const canvas = page.locator('canvas[role="img"]');
        await expect(canvas).toBeVisible();
        // Chart.js sizes the canvas to its container once it has initialised.
        await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(400);

        const box = (await canvas.boundingBox())!;

        // Selection is by column (interaction.mode 'index'), so the height only
        // has to be inside the plot area rather than on the marker itself.
        const clickColumn = (fraction: number) =>
            page.mouse.click(box.x + box.width * fraction, box.y + box.height * 0.4);

        // The 10-year 'overall' series is negative only in its first window
        // (1986–1995) and positive by its last — the sign change the third post
        // in the series is named for. 0.05 is well inside that first column;
        // 0.12 sits on its boundary.
        //
        // Clicked until the readout confirms it landed: Chart.js binds its
        // listeners after the entry animation, so the first click of a run is
        // otherwise dropped and only one side of zero is ever recorded.
        const selectedWindow = page.locator('.tabular-nums').first();

        await expect
            .poll(async () => {
                await clickColumn(0.05);
                return selectedWindow.textContent();
            }, { timeout: 15_000 })
            .toBe('1986–1995');

        expect(await unlockedIds(page), 'one side of zero is not a change of sign')
            .not.toContain('contra');

        await clickColumn(0.93);
        await expect.poll(() => unlockedIds(page)).toContain('contra');
    });
});

test.describe('The Collation', () => {
    test('wants one text in two tongues, not two texts in one', async ({ page }) => {
        await page.goto('/en/blog/welfare-part-1');
        await page.evaluate(() => localStorage.clear());

        // A second post in the same language is not a collation.
        await page.goto('/en/blog/welfare-part-2');
        expect(await unlockedIds(page)).not.toContain('collatio');

        // The same post in the other tongue is.
        await page.goto('/blog/welfare-part-2');
        await expect.poll(() => unlockedIds(page)).toContain('collatio');
    });
});

test.describe('Brought Forward', () => {
    test('waits a week, and measures it from the oldest entry', async ({ page }) => {
        const day = 24 * 60 * 60 * 1000;
        const now = Date.now();

        await page.goto('/en');

        // Six days is not a week.
        await seed(page, 50, ['explorer'], { explorer: now - 6 * day });
        await page.reload();
        await page.waitForTimeout(1600);
        expect(await unlockedIds(page)).not.toContain('brought_forward');

        // Eight is. Measured from the oldest stamp, so a recent second entry
        // does not reset the clock.
        await seed(page, 150, ['explorer', 'manicule'], {
            explorer: now - 8 * day,
            manicule: now - 60_000
        });
        await page.reload();
        await expect.poll(() => unlockedIds(page)).toContain('brought_forward');
    });

    test('is not granted to a visitor with an empty book', async ({ page }) => {
        await page.goto('/en');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForTimeout(1600);

        expect(await unlockedIds(page)).not.toContain('brought_forward');
    });
});

test.describe('The Absolution', () => {
    test('is granted for coming back to cite, but not for citing first', async ({ page }) => {
        const hour = 60 * 60 * 1000;
        const now = Date.now();

        // Cursed, then cited. The order is the joke, so the order is checked.
        await page.goto('/en/ledger');
        await seed(page, 450, ['anathema', 'colophon'], {
            anathema: now - 2 * hour,
            colophon: now - hour
        });
        await page.reload();
        await expect.poll(() => unlockedIds(page)).toContain('absolutio');

        // Cited, and only cursed afterwards — no absolution in that.
        await seed(page, 450, ['anathema', 'colophon'], {
            anathema: now - hour,
            colophon: now - 2 * hour
        });
        await page.reload();
        await page.waitForTimeout(1500);
        expect(await unlockedIds(page)).not.toContain('absolutio');
    });
});
