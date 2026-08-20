import { test, expect } from '@playwright/test';

/**
 * The Reviewer's shell, without spending a model call.
 *
 * Live model calls are deliberately kept out of `npm run test` — that runs on every
 * push — so this asserts only what can be checked for free: that the island mounts at
 * all, that the ids the shared renderers resolve by are present, and that the palette
 * did not drift back. The Reviewer spent a long time built on `useChat` options that
 * did not exist, rendering nothing while looking fine in the source, so "does it
 * actually mount" is worth a test of its own.
 */
test.describe('The Reviewer', () => {
    test('mounts, exposes the ids the shared renderers need, and stays on palette', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));

        await page.goto('/projects/welfare-state-seminar');

        const toggle = page.locator('button[title="AI Project Reviewer"]');
        await expect(toggle, 'the client:only island hydrated').toBeVisible({ timeout: 30_000 });
        await toggle.click();

        // createChatRenderers resolves the input and form by id for its suggestion
        // chips; a rename here breaks them silently.
        await expect(page.locator('#projectbot-messages')).toBeVisible();
        await expect(page.locator('#projectbot-form')).toBeAttached();
        await expect(page.locator('#projectbot-input')).toBeAttached();

        // A scrolling transcript a keyboard user cannot reach is the violation the wide
        // sweep caught on the other two clients.
        await expect(page.locator('#projectbot-messages')).toHaveAttribute('tabindex', '0');

        const control = page.locator('#projectbot-form button');
        await expect(control).toHaveAttribute('aria-label', 'Send message');

        const panel = await page.locator('#projectbot-messages').evaluate(
            (el) => (el.closest('div[class*="fixed"]') || el.parentElement)!.outerHTML,
        );
        expect(panel, 'the Reviewer was on a third palette — blue — until this').not.toMatch(
            /blue-\d|gray-\d00|text-white/,
        );

        expect(errors).toEqual([]);
    });
});
