import { test, expect } from '@playwright/test';

/**
 * The five entries that required building something rather than hooking
 * something that already existed.
 *
 * Most of what is asserted here is what each egg must *not* do — the copy still
 * reaching the clipboard, the navigation staying in Latin script, the trigger
 * not firing while someone types into a form. An easter egg that breaks the site
 * around it is just a bug with a nicer name.
 */

const STORAGE_KEY = 'anton_gamification_state';

async function unlockedIds(page: import('@playwright/test').Page): Promise<string[]> {
    return page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw).unlockedAchievements ?? [] : [];
    }, STORAGE_KEY);
}

/** Type a word at the document, one key at a time, as the trigger expects. */
async function typeWord(page: import('@playwright/test').Page, word: string) {
    for (const ch of word) await page.keyboard.press(ch);
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
