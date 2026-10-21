import { test, expect } from '@playwright/test';

test('container width aliases remain independent of spacing tokens on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/cliometrics');
  const subtitle = page.locator('#family-history .structural-transformation-galaxy > div > p').first();
  await expect(subtitle).toHaveCSS('max-width', '672px');
  expect((await subtitle.boundingBox())?.width).toBeGreaterThan(240);
});

test('links in running text retain their non-colour distinction', async ({ page }) => {
  await page.goto('/team');
  const link = page.locator('p a.text-blue-400').first();
  await expect(link).toHaveCSS('text-decoration-line', 'underline');
});

for (const [prefix, title] of [['', 'Downloads & templates'], ['/en', 'Downloads & Templates'], ['/de', 'Downloads & Vorlagen']]) {
  test(`resources headings render from both nested and legacy UI data: ${prefix || 'da'}`, async ({ page }) => {
    await page.goto(`${prefix}/resources`);
    await expect(page.locator('main h1')).toHaveText(title);
    await expect(page.locator('main h1')).toBeVisible();
  });
}
