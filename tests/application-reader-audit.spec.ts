import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PDFParse } from 'pdf-parse';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    if (route.request().method() !== 'GET') return route.abort();
    return route.continue();
  });
});

const projects = ['demography-project', 'master-thesis', 'genai-inequality', 'welfare-state-seminar'];
for (const prefix of ['', '/en']) {
  const isEn = prefix === '/en';
  for (const id of projects) {
    test(`${prefix || 'da'}/${id}: individual contribution and joint attribution are explicit`, async ({ page }) => {
      await page.goto(`${prefix}/projects/${id}`);
      const role = page.locator('[data-research-contribution]');
      await expect(role).toHaveCount(1);
      await expect(role.getByRole('heading', { name: isEn ? 'My contribution' : 'Mit bidrag', exact: true })).toBeVisible();
      if (id !== 'demography-project') {
        await expect(role.locator('[data-contribution-attribution]')).toContainText('Jonas');
        await expect(role.locator('[data-contribution-attribution]')).toContainText('Sheng Ye Michael Chen');
      }
      if (id === 'master-thesis') {
        await expect(role).toContainText(isEn ? 'planter model' : 'plantermodellen');
        expect(await page.locator('main a[href$=".pdf"]').count()).toBe(0);
      }
    });
  }

  test(`${prefix || 'da'}: real source fields, structured decision and caveats remain accessible`, async ({ page }) => {
    await page.goto(`${prefix}/projects/demography-project`);
    const example = page.locator('[data-source-to-data]');
    await example.scrollIntoViewIfNeeded();
    await expect(example).toContainText('VIT1867.XLS');
    await expect(example.getByRole('table')).toContainText('1866');
    const record = JSON.parse(await example.locator('[data-structured-record]').innerText());
    expect(record).toMatchObject({ county_code: 545, year: 1866, in_study_window: false });
    await expect(example).toContainText(isEn ? 'AI coding assistance' : 'AI-kodningsassistance');
    await expect(example).toContainText(isEn ? 'not a complete worksheet or an original archival image' : 'ikke et helt regneark eller et originalt arkivbillede');
    await expect(example.getByRole('link', { name: 'Galloway Prussia Database 1861 to 1914' })).toHaveAttribute('href', 'https://www.patrickrgalloway.com/prussia.htm');
  });

  test(`${prefix || 'da'}: application-facing main links, fragments and images resolve`, async ({ page, request }) => {
    test.setTimeout(120_000);
    const checked = new Set<string>();
    const pages = [prefix || '/', `${prefix}/cv`, `${prefix}/about`, `${prefix}/cliometrics`,
      ...projects.map(id => `${prefix}/projects/${id}`)];
    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBe(true);
      const references = await page.locator('main').evaluate(element => ({
        links: Array.from(element.querySelectorAll<HTMLAnchorElement>('a[href]')).map(link => link.getAttribute('href')!),
        images: Array.from(element.querySelectorAll<HTMLImageElement>('img[src]')).map(image => image.getAttribute('src')!),
      }));
      for (const href of references.links) {
        if (href.startsWith('#') && href.length > 1) {
          expect(await page.locator(`[id="${href.slice(1)}"]`).count(), `${path}: ${href}`).toBe(1);
        }
      }
      for (const href of [...references.links, ...references.images]) {
        if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/')) continue;
        const clean = href.split('#')[0];
        if (checked.has(clean)) continue;
        const linked = await request.get(clean);
        expect(linked.ok(), `${path} → ${href}`).toBe(true);
        checked.add(clean);
      }
    }
  });

  test(`${prefix || 'da'}: mobile contribution and source example have no overflow or accessibility violations`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of projects) {
      await page.goto(`${prefix}/projects/${id}`);
      await page.evaluate(() => document.fonts.ready);
      const role = page.locator('[data-research-contribution]');
      await role.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const scope = new AxeBuilder({ page }).include('[data-research-contribution]');
      if (id === 'demography-project') {
        await page.locator('[data-source-to-data]').scrollIntoViewIfNeeded();
        scope.include('[data-source-to-data]');
      }
      const scan = await scope.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(scan.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.html) }))).toEqual([]);
    }
    await page.goto(`${prefix}/projects/demography-project`);
    // The existing optional achievement toast auto-dismisses; don't freeze it
    // over the source excerpt in a long element screenshot.
    await expect(page.locator('#ledger-toast')).toBeHidden({ timeout: 12_000 });
    await page.locator('[data-source-to-data]').screenshot({ path: `test-results/source-to-data-${isEn ? 'en' : 'da'}-mobile.png` });
  });

  test(`${prefix || 'da'}: print layout retains identity and contributions without navigation`, async ({ page }) => {
    await page.goto(`${prefix}/cv`);
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator('main h1').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Arial');
    await expect(page.locator('main h1')).toHaveText('Anton Meier Ebsen Jørgensen');
    await expect(page.locator('#projects')).toContainText(isEn ? 'planter-model calibration' : 'kalibrering af plantermodellen');
    await expect(page.locator('nav').first()).toBeHidden();
    await expect(page.locator('footer')).toBeHidden();
    await expect(page.locator('#chat-widget')).toBeHidden();
    const bytes = await page.pdf({ path: `test-results/application-cv-${isEn ? 'en' : 'da'}-print.pdf`, format: 'A4', preferCSSPageSize: true });
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      if (result.total !== 1) console.log('Print layout diagnostic', prefix, await page.locator('main').evaluate(main => ({
        height: main.getBoundingClientRect().height,
        sections: Array.from(main.querySelectorAll('section')).map(section => ({ id: section.id,
          height: section.getBoundingClientRect().height, margin: getComputedStyle(section).marginTop })),
        article: main.querySelector('article') && { padding: getComputedStyle(main.querySelector('article')!).padding,
          margin: getComputedStyle(main.querySelector('article')!).marginBottom },
      })));
      expect(result.total).toBe(1);
      expect(result.text).toContain('Anton Meier Ebsen Jørgensen');
    } finally { await parser.destroy(); }
  });
}

test('new research evidence is readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/en/projects/demography-project');
  await expect(page.locator('[data-research-contribution]')).toBeVisible();
  await expect(page.locator('[data-source-to-data]')).toContainText('1866');
  await context.close();
});
