import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // These are read-only local-page tests, not live service or form-submission tests.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (route.request().method() !== 'GET') return route.abort();
    return route.continue();
  });
});

for (const prefix of ['', '/en']) {
  for (const path of ['/', '/cliometrics', '/cv', '/portfolio']) {
    test(`${prefix || 'da'}${path}: highlights actual research without placeholders`, async ({ page }) => {
      const response = await page.goto(`${prefix}${path === '/' && prefix ? '' : path}`);
      expect(response?.ok()).toBe(true);
      const main = path === '/cv' ? page.locator('.cv-main') : page.locator('main');
      await expect(main.getByRole('heading', { name: 'Bismarck’s Lost Battle', exact: true })).toHaveCount(1);
      await expect(main).not.toContainText(/TBD|1–2 linjer|X\+ students|zenodo\.xxxx|Monetary Policy & Economic Relations/);
      expect(await main.locator(`a[href="${prefix}/projects/demography-project"]`).count()).toBeGreaterThan(0);
    });
  }
  for (const [id, stage] of [['demography-project', 'completed'], ['master-thesis', 'ongoing'], ['genai-inequality', 'proposal']]) {
    test(`${prefix || 'da'}/${id}: stage, data and caveats are explicit`, async ({ page }) => {
      const response = await page.goto(`${prefix}/projects/${id}`);
      expect(response?.ok()).toBe(true);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator(`main [data-research-status="${stage}"]`)).toBeVisible();
      await expect(page.getByRole('heading', { name: prefix ? 'Limitations' : 'Begrænsninger', exact: true })).toBeVisible();
      expect(await page.locator('main a[href="#"]').count()).toBe(0);
      expect(await page.locator('main a[href$=".pdf"]').count()).toBe(id === 'demography-project' ? 1 : 0);
    });
  }
}

test('English mobile research page fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/cliometrics');
  const heading = page.getByRole('heading', { name: 'Selected research projects', exact: true });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();
  await expect.poll(() => page.locator('.animate-on-scroll').evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === '1'))).toBe(true);
  const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({ path: 'test-results/academic-research-mobile.png', fullPage: true });
});

test('demography PDF is served and matches a real PDF file', async ({ page, request }) => {
  await page.goto('/en/projects/demography-project');
  const url = await page.getByRole('link', { name: 'Download paper (PDF)', exact: true }).getAttribute('href');
  expect(url).toBeTruthy();
  const response = await request.get(url!);
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.getByRole('link', { name: 'Code and related analysis on GitHub' })).toHaveAttribute('href', 'https://github.com/AntonEbsen/Demography');
});

test('English homepage preview and printable CV identity', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('link', { name: 'Explore research', exact: true })).toHaveAttribute('href', '/en/cliometrics');
  await page.locator('[data-research-projects]').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.animate-on-scroll').evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === '1'))).toBe(true);
  await page.screenshot({ path: 'test-results/academic-home-desktop.png', fullPage: true });
  await page.goto('/en/cv');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.cv-side')).toBeHidden();
  await expect(page.locator('#ledger-toast')).toBeHidden();
  await expect(page.locator('.cv-print-heading')).toBeVisible();
  await expect(page.locator('.cv-print-heading')).toContainText('Anton Meier Ebsen Jørgensen');
  await expect(page.locator('#profile')).toBeVisible();
  await expect(page.locator('#projects article p').first()).toHaveCSS('color', 'rgb(34, 34, 34)');
  await expect(page.locator('#projects article p').first()).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/academic-cv-print.png', fullPage: true });
});

test('English and Danish canonical links use their respective domains', async ({ page }) => {
  await page.goto('/en/projects/demography-project');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.antonebsen.com/en/projects/demography-project');
  await expect(page.locator('link[hreflang="da"]:not([type])')).toHaveAttribute('href', 'https://antonebsen.dk/projects/demography-project');
  await page.goto('/projects/demography-project');
  await expect(page.locator('html')).toHaveAttribute('lang', 'da');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://antonebsen.dk/projects/demography-project');
  await expect(page.locator('link[hreflang="en"]:not([type])')).toHaveAttribute('href', 'https://www.antonebsen.com/en/projects/demography-project');
});
