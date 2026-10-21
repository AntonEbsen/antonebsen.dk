import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';

const title = 'Bismarck’s Lost Battle: Marriage, Fertility, and the Kulturkampf in Prussia, 1867–1890';
const sha = '086a7d333c7a9b85f6476e90de30f4f3cfd76d1720996ca0aebfb532803d5e41';
for (const [prefix, origin] of [['', 'https://antonebsen.dk'], ['/en', 'https://www.antonebsen.com']]) {
  const path = `${prefix}/projects/demography-project`;

  test(`${prefix || 'da'}: verified Scholar metadata parses in head`, async ({ page }) => {
    await page.goto(path);
    const tags = await page.locator('head meta[name^="citation_"]').evaluateAll(nodes =>
      nodes.map(node => ({ name: node.getAttribute('name'), content: node.getAttribute('content') })));
    expect(tags).toContainEqual({ name: 'citation_title', content: title });
    expect(tags.filter(tag => tag.name === 'citation_author')).toEqual([{ name: 'citation_author', content: 'Jørgensen, Anton Meier Ebsen' }]);
    expect(tags).toContainEqual({ name: 'citation_publication_date', content: '2026/05/29' });
    expect(tags).toContainEqual({ name: 'citation_language', content: 'en' });
    expect(tags).toContainEqual({ name: 'citation_pdf_url', content: `${origin}${path}.pdf` });
    expect(tags).toContainEqual({ name: 'citation_abstract_html_url', content: `${origin}${path}` });
    expect(await page.locator('body meta[name^="citation_"]').count()).toBe(0);
    expect(JSON.stringify(tags)).not.toMatch(/journal_title|conference_title|report_number|citation_doi|Casper/);
    const articles = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes =>
      nodes.map(node => JSON.parse(node.textContent || '{}')).filter(item => item['@type'] === 'ScholarlyArticle'));
    expect(articles).toHaveLength(1);
    expect(articles[0].author.name).toBe('Anton Meier Ebsen Jørgensen');
    expect(articles[0].creativeWorkStatus).toContain('not peer reviewed');
  });

  test(`${prefix || 'da'}: full text and BibTeX resolve without replacing the original PDF`, async ({ page, request }) => {
    await page.goto(path);
    const link = page.getByRole('link', { name: prefix ? 'Download paper (PDF)' : 'Download opgave (PDF)', exact: true });
    await expect(link).toHaveAttribute('href', `${path}.pdf`);
    const pdf = await request.get(`${path}.pdf`);
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe(sha);
    const original = await request.get('/assets/docs/Ebsen_Jorgensen_2026_Bismarcks_Lost_Battle.pdf');
    expect(createHash('sha256').update(await original.body()).digest('hex')).toBe(sha);
    await expect(page.getByRole('link', { name: 'Download BibTeX', exact: true })).toHaveAttribute('href', `${path}.bib`);
    const bib = await request.get(`${path}.bib`);
    expect(bib.ok()).toBe(true);
    expect(await bib.text()).toContain('@unpublished{Jorgensen2026Bismarck,');
    expect(await bib.text()).toContain('Not peer reviewed.');
    await expect(page.locator('[data-paper-citation]')).toContainText(title);
  });
}

test('summary and paper link are accessible without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/en/projects/demography-project');
  await expect(page.locator('[data-paper-summary]')).toBeVisible();
  await expect(page.locator('[data-paper-summary]')).toContainText('limit a causal interpretation');
  await expect(page.getByRole('link', { name: 'Download paper (PDF)', exact: true })).toBeVisible();
  await context.close();
});

test('mobile paper page has no overflow or accessibility violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/projects/demography-project');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(scan.violations).toEqual([]);
  await page.screenshot({ path: 'test-results/demography-scholar-mobile.png', fullPage: true });
});
