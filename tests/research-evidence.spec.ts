import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.request().method() === 'GET' ? route.continue() : route.abort();
  });
});

for (const prefix of ['', '/en']) {
  test(`${prefix || 'da'}: bounded thesis excerpt is readable and attributed`, async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${prefix}/projects/master-thesis`);
    const excerpt = page.locator('[data-thesis-excerpt]');
    await expect(excerpt).toBeVisible();
    await expect(page.locator('[data-research-status]')).toHaveAttribute('data-research-status', 'ongoing');
    await excerpt.locator('summary').click();
    await expect(excerpt.locator('[data-thesis-record]')).toContainText('"total": 86');
    for (const image of await excerpt.locator('img').all()) {
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 295)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect((await new AxeBuilder({ page }).include('[data-thesis-excerpt]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    const provenance = await (await request.get('/assets/research/thesis-excerpt/provenance.json')).json();
    expect(provenance.record).toEqual({ creoles: 54, africans: 32, total: 86 });
    expect(provenance.source.imageId).toBe(58788329);
    expect(JSON.stringify(provenance)).not.toMatch(/"keys"|"names"|Master-Thesis\/data/);
    await page.screenshot({ path: `test-results/thesis-excerpt-${prefix ? 'en' : 'da'}-mobile.png`, fullPage: true });
    await excerpt.screenshot({ path: `test-results/thesis-excerpt-${prefix ? 'en' : 'da'}-component.png` });
  });
  test(`${prefix || 'da'}: table audit preserves scope and downloadable evidence`, async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${prefix}/projects/demography-project`);
    const audit = page.locator('[data-table-audit]');
    await audit.locator('summary').click();
    await expect(audit.locator('[data-audited-outcome]')).toHaveCount(4);
    await expect(audit.locator('[data-table-audit-scope]')).toContainText(prefix ? 'not full-paper replication' : 'ikke fuld replikation');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    expect((await new AxeBuilder({ page }).include('[data-table-audit]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    const report = await (await request.get('/assets/research/table-6-1-audit.json')).json();
    expect(report.rows).toHaveLength(8);
    expect(report.rows.every((row: { matches: Record<string, boolean> }) => Object.values(row.matches).every(Boolean))).toBe(true);
    expect(report.inputCount).toBe(146);
    await expect(audit.locator('a').first()).toHaveAttribute('href', /github\.com\/AntonEbsen\/Demography\/blob\/[a-f0-9]{40}\/reproducibility\/table-6-1\/README.md/);
    const pdf = await (await request.get(`${prefix}/projects/demography-project.pdf`)).body();
    expect(createHash('sha256').update(pdf).digest('hex')).toBe(report.paperSha256);
    await page.screenshot({ path: `test-results/table-audit-${prefix ? 'en' : 'da'}-mobile.png`, fullPage: true });
    await audit.screenshot({ path: `test-results/table-audit-${prefix ? 'en' : 'da'}-component.png` });
  });
}

test('new evidence remains available when printed', async ({ page }) => {
  await page.goto('/en/projects/master-thesis');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-thesis-excerpt]')).toBeVisible();
  await page.locator('[data-thesis-excerpt-detail] summary').click();
  await expect(page.locator('[data-thesis-record]')).toBeVisible();
  await page.goto('/en/projects/demography-project');
  await page.locator('[data-table-audit-detail] summary').click();
  await expect(page.locator('[data-table-audit-scope]')).toBeVisible();
});
