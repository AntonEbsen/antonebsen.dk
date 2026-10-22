import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (route.request().method() !== 'GET') return route.abort();
    return route.continue();
  });
});

for (const prefix of ['', '/en']) {
  const isEn = prefix === '/en';
  test(`${prefix || 'da'}: old research URL permanently redirects to the canonical research page`, async ({ page, request }) => {
    const response = await request.get(`${prefix}/research`, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe(`${prefix}/cliometrics`);
    await page.goto(`${prefix}/research`);
    await expect(page).toHaveURL(`${prefix}/cliometrics`);
    await expect(page.locator('main')).not.toContainText(/PhD Quest|Very High|British Fertility Transition|The Cost of Quality/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',
      `${isEn ? 'https://www.antonebsen.com' : 'https://antonebsen.dk'}${prefix}/cliometrics`);
  });

  test(`${prefix || 'da'}: homepage offers the unchanged writing sample directly`, async ({ page, request }) => {
    await page.goto(prefix || '/');
    const links = page.locator('[data-application-links]');
    const writingSample = links.getByRole('link', { name: isEn ? 'Read my writing sample (PDF)' : 'Læs min skriftlige opgave (PDF)', exact: true });
    await expect(writingSample).toBeVisible();
    await expect(writingSample).toHaveAttribute('href', `${prefix}/projects/demography-project.pdf`);
    expect(await links.getByRole('link').count()).toBe(3);
    const pdf = await request.get((await writingSample.getAttribute('href'))!);
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe('086a7d333c7a9b85f6476e90de30f4f3cfd76d1720996ca0aebfb532803d5e41');
  });

  test(`${prefix || 'da'}: demography figure, discrepancy and limited scope are visible`, async ({ page, request }) => {
    await page.goto(`${prefix}/projects/demography-project`);
    const check = page.locator('[data-figure-validation]');
    await check.scrollIntoViewIfNeeded();
    await expect(check).toBeVisible();
    await expect(check.locator('time')).toHaveAttribute('datetime', '2026-10-22');
    await expect(check.locator('table')).toContainText('392');
    await expect(check.locator('table')).toContainText('262');
    await expect(check.locator('table')).toContainText('130');
    await expect(check.locator('[data-validation-discrepancy]')).toContainText(isEn ? '23.47%' : '23,47%');
    await expect(check.locator('[data-validation-discrepancy]')).toContainText('22%');
    await expect(check.locator('[data-validation-scope]')).toContainText(isEn ? 'does not validate regression results' : 'validerer ikke regressionsresultater');
    await expect(check.locator('img')).toHaveJSProperty('naturalWidth', 1423);
    const source = check.getByRole('link', { name: isEn ? 'Method, source files and exclusions' : 'Metode, kildefiler og udeladelser' });
    await expect(source).toHaveAttribute('href', /\/blob\/2222e9732dd93f14495b3f68fd6d621dfd559c32\/.*figure_4_1_validation\.md$/);
    const results = await request.get('/assets/research/demography/figure-4-1-validation.json');
    expect(results.ok()).toBe(true);
    expect((await results.json()).metrics.counties).toBe(392);
  });
}

test('search uses current research pages without redirecting notebook asset paths', async ({ request }) => {
  const response = await request.get('/search-index.json');
  expect(response.ok()).toBe(true);
  const entries = await response.json();
  expect(entries.some((entry: { url: string }) => ['/research', '/en/research'].includes(entry.url))).toBe(false);
  for (const prefix of ['', '/en']) {
    expect(entries.some((entry: { url: string }) => entry.url === `${prefix}/cliometrics`)).toBe(true);
  }
  // The redirect is exact, not /research/*; a missing local lab build may 404,
  // but it must never be redirected to the research landing page.
  const lab = await request.get('/research/lab/index.html?path=exchange-rate-analysis.ipynb', { maxRedirects: 0 });
  expect([301, 302, 307, 308]).not.toContain(lab.status());
});

test('English mobile homepage and validation remain readable and accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/en', '/en/projects/demography-project']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    // Let real scroll-reveal animations finish before measuring final contrast.
    for (const section of await page.locator('.animate-on-scroll').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await expect.poll(() => page.locator('.animate-on-scroll').evaluateAll(elements =>
      elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(scan.violations.map(violation => ({ id: violation.id,
      nodes: violation.nodes.map(node => ({ html: node.html, issue: node.failureSummary })) }))).toEqual([]);
    if (path === '/en') {
      await page.screenshot({ path: 'test-results/application-home-mobile.png', fullPage: true });
    } else {
      await page.locator('[data-figure-validation]').scrollIntoViewIfNeeded();
      await page.locator('[data-figure-validation]').screenshot({ path: 'test-results/demography-validation-mobile.png' });
    }
  }
});

test('validation is readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/en/projects/demography-project');
  const check = page.locator('[data-figure-validation]');
  await expect(check).toBeVisible();
  await expect(check).toContainText('23.47%');
  await expect(check.getByRole('table')).toBeVisible();
  await context.close();
});
