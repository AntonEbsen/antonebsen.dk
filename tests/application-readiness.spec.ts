import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort();
    if (url.pathname.startsWith('/api/')) return route.fulfill({status:200, contentType:'application/json', body:'{}'});
    return route.continue();
  });
});

for (const prefix of ['', '/en']) {
  test(`${prefix || 'da'}: concise CV, working PDF and retained extended profile`, async ({ page, request }) => {
    await page.goto(`${prefix}/cv`);
    const main = page.locator('main');
    await expect(main.locator('h1')).toHaveText('Anton Meier Ebsen Jørgensen');
    await expect(main).toContainText(/januar 2027|January 2027/);
    await expect(main).not.toContainText(/Anti-Resume|Anti-CV|Personality|MATLAB Onramp|PhD Candidate/);
    await expect(main.locator('#projects article')).toHaveCount(4);
    const download = main.locator('a[download]');
    const href = await download.getAttribute('href');
    expect(href).toBe('/assets/docs/Anton_Ebsen_Academic_CV.pdf');
    const pdf = await request.get(href!);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect(createHash('sha256').update(await pdf.body()).digest('hex')).toBe(createHash('sha256').update(readFileSync('public' + href)).digest('hex'));
    await main.locator(`a[href="${prefix}/cv/full"]`).click();
    await expect(page.locator('#certifications')).toBeAttached();
    await expect(page.locator('#discovery')).toBeAttached();
  });
  test(`${prefix || 'da'}: research status is accurate and family history is optional`, async ({ page }) => {
    await page.goto(`${prefix}/cliometrics`);
    await expect(page.locator('main')).not.toContainText(/PhD Candidate|PhD Aspirant/i);
    await expect(page.getByRole('heading', {name:'Globalization and the Welfare State',exact:true})).toBeVisible();
    const personal = page.locator('#family-history details');
    await expect(personal).not.toHaveAttribute('open', '');
    await personal.locator('summary').click();
    await expect(personal).toContainText(prefix ? 'MSc Economics student' : 'Kandidatstuderende i økonomi');
  });
}
test('academic navigation makes CV directly reachable, including on mobile', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/en');
  const nav = page.getByRole('navigation', {name:'Main navigation'});
  await expect(nav.getByRole('link', {name:'CV',exact:true})).not.toHaveAttribute('aria-haspopup', 'true');
  await nav.getByRole('link', {name:'CV',exact:true}).click();
  await expect(page).toHaveURL(/\/en\/cv$/);
  const sizes = await page.evaluate(() => ({width:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth}));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:'test-results/academic-cv-mobile.png',fullPage:true});
});
test('CV and its PDF link remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({javaScriptEnabled:false,baseURL});
  const page = await context.newPage();
  await page.goto('/en/cv');
  await expect(page.locator('#projects')).toBeVisible();
  await expect(page.locator('main a[download]')).toBeVisible();
  await context.close();
});
