import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards against the site asserting things that are not true.
 *
 * The blog template used to carry a hardcoded "Fallback for AI Post (Legacy)"
 * branch that printed two invented references — Bernanke (2025) and Lagarde
 * (2024) — on every post without a `footnotes` array. That was 13 of 16 posts
 * showing fabricated citations, with ↩ links to anchors that existed nowhere.
 * On an economic historian's site that is the worst class of bug there is, so
 * it gets a test rather than just a fix.
 */

const BLOG_DIR = join(process.cwd(), 'src', 'content', 'blog');

type Post = { slug: string; footnotes: { id: string }[]; body: string };

function posts(): Post[] {
    return readdirSync(BLOG_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
            const raw = JSON.parse(readFileSync(join(BLOG_DIR, f), 'utf-8'));
            return {
                slug: f.replace(/\.json$/, ''),
                footnotes: raw.footnotes ?? [],
                // Everything the reader sees, both languages, for the "is this
                // name actually in the source?" check below.
                body: [...(raw.content ?? []), ...(raw.content_da ?? [])].join('\n')
            };
        });
}

const ALL = posts();
const WITH_NOTES = ALL.filter((p) => p.footnotes.length > 0);
const WITHOUT_NOTES = ALL.filter((p) => p.footnotes.length === 0);

test.describe('Blog citations', () => {
    test('the content set is what these tests assume', () => {
        expect(ALL.length, 'blog posts found').toBeGreaterThan(10);
        expect(WITH_NOTES.length, 'posts with footnotes').toBeGreaterThan(0);
        expect(WITHOUT_NOTES.length, 'posts without footnotes').toBeGreaterThan(0);
    });

    test('no post renders a citation that is not in its own source', async ({ page }) => {
        // The two invented names, plus a generic check that nothing else is
        // conjured into the notes list.
        const GHOSTS = ['Bernanke', 'Lagarde'];

        for (const post of ALL) {
            await page.goto(`/blog/${post.slug}`);
            const rendered = (await page.locator('article').innerText()).toLowerCase();

            for (const ghost of GHOSTS) {
                if (post.body.toLowerCase().includes(ghost.toLowerCase())) continue;
                expect(
                    rendered.includes(ghost.toLowerCase()),
                    `/blog/${post.slug} renders "${ghost}" but its JSON never mentions it`
                ).toBe(false);
            }
        }
    });

    test('a post with no footnotes shows no notes section at all', async ({ page }) => {
        const post = WITHOUT_NOTES[0];
        await page.goto(`/blog/${post.slug}`);

        await expect(page.locator('article li[id^="fn-"]')).toHaveCount(0);
        await expect(page.locator('article').getByRole('heading', { name: /^(Noter|Notes|Footnotes)$/i })).toHaveCount(0);
    });

    test('every footnote has a marker pointing at it, in both languages', async ({ page }) => {
        for (const post of WITH_NOTES) {
            for (const [path, label] of [[`/blog/${post.slug}`, 'da'], [`/en/blog/${post.slug}`, 'en']] as const) {
                await page.goto(path);

                for (const fn of post.footnotes) {
                    // The note itself renders…
                    await expect(
                        page.locator(`article li#fn-${fn.id}`),
                        `${path} (${label}) should render note ${fn.id}`
                    ).toHaveCount(1);

                    // …and something in the prose points at it. A footnote list
                    // with no reference mark is what /en/blog/gfc-part-1 had.
                    await expect(
                        page.locator(`article sup#ref-${fn.id} a[href="#fn-${fn.id}"]`),
                        `${path} (${label}) should have a marker for note ${fn.id}`
                    ).toHaveCount(1);
                }
            }
        }
    });
});

test.describe('Project lab modal', () => {
    test('the Execute Lab button opens the modal', async ({ page }) => {
        // The click handler was registered inside an 'astro:page-load' listener,
        // which never fires on this site — so this button did nothing at all.
        // /projects/ecb-taylor-rules is the one project that sets `notebookPath`
        // and therefore the only page that renders the button.
        await page.goto('/projects/ecb-taylor-rules');

        const btn = page.locator('#open-lab-btn');
        await expect(btn, 'this project should render the lab button').toHaveCount(1);

        // LabModal renders no dialog role, so assert on its heading — the
        // Danish route shows the Danish title.
        const heading = page.getByRole('heading', { name: 'Økonomisk Laboratorium' });

        // Retried, because LabModal is client:only: a click that lands before
        // React has registered the 'open-lab-modal' listener dispatches into
        // nothing, and under parallel load that happens often enough to matter.
        await expect(async () => {
            await btn.click();
            await expect(heading).toBeVisible({ timeout: 1_000 });
        }).toPass({ timeout: 15_000 });
    });
});
