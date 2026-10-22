import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
  test(`${prefix || 'da'}: academic routes remain still and ignore stored games`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('anton_scriptorium', '1');
      localStorage.setItem('anton_gamification_state', '{"xp":50,"unlockedAchievements":["explorer"]}');
    });
    for (const path of ['', '/cv', '/about', '/contact', '/cliometrics', '/projects/demography-project', '/projects/master-thesis', '/projects/genai-inequality', '/projects/welfare-state-seminar']) {
      await page.goto(`${prefix}${path}` || '/');
      await expect(page.locator('body')).toHaveAttribute('data-academic-reader', '');
      await expect(page.locator('#chat-widget, #ledger-toast, #ledger-modal, #scriptorium-bar, #anathema, #command-palette, button[title="AI Project Reviewer"]')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveClass(/scriptorium-active/);
      await expect(page.locator('#main-content')).not.toContainText('ſ');
      expect(await page.locator('main .animate-on-scroll').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).opacity === '1'))).toBe(true);
    }
    expect(await page.evaluate(() => localStorage.getItem('anton_scriptorium'))).toBe('1');
    expect(await page.evaluate(() => localStorage.getItem('anton_gamification_state'))).toBe('{"xp":50,"unlockedAchievements":["explorer"]}');
  });
  test(`${prefix || 'da'}: four compact briefs retain expandable evidence and mobile access`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of ['demography-project', 'master-thesis', 'genai-inequality', 'welfare-state-seminar']) {
      await page.goto(`${prefix}/projects/${id}`);
      await expect(page.locator('[data-research-brief]')).toBeVisible();
      await expect(page.locator('[data-research-brief] dt')).toHaveCount(4);
      await expect(page.locator('[data-research-contribution]')).toBeVisible();
      const details = page.locator('[data-research-details], details[data-project-details]');
      await expect(details).not.toHaveAttribute('open');
      await details.locator(':scope > summary').click();
      await expect(details).toHaveAttribute('open', '');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      const scan = await new AxeBuilder({ page }).include('[data-research-brief]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(scan.violations).toEqual([]);
    }
    await page.goto(`${prefix}/projects/demography-project`);
    await page.screenshot({ path: `test-results/academic-reader-${prefix ? 'en' : 'da'}-mobile.png`, fullPage: true });
  });
}
test('personal pages retain the opt-in character and features', async ({ page }) => {
  await page.goto('/en/notes');
  await expect(page.locator('body')).not.toHaveAttribute('data-academic-reader');
  await expect(page.locator('#ledger-toast, #scriptorium-bar, #anathema')).toHaveCount(3);
  await expect(page.locator('#chat-widget')).toHaveCount(1);
});
test('compact project summaries and native disclosure work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/en/projects/welfare-state-seminar');
  await expect(page.locator('[data-research-brief]')).toContainText('does not identify causal effects');
  await page.locator('[data-project-details] > summary').click();
  await expect(page.locator('#executive-summary')).toBeVisible();
  await context.close();
});
test('the reproduction recipe exposes the fixed revision and its limits', async ({ page }) => {
  await page.goto('/en/projects/demography-project');
  const recipe = page.locator('[data-figure-reproduction]');
  await recipe.locator('summary').click();
  await expect(recipe).toContainText('Python 3.12');
  await expect(recipe.locator('code')).toContainText('git checkout be82847e662fa73023fe8895810357cf31b08f84');
  await expect(recipe).toContainText('does not mean full-paper replication');
  await expect(recipe.locator('a')).toHaveAttribute('href', /be82847e662fa73023fe8895810357cf31b08f84/);
});
test('existing links into the detailed paper open its disclosure', async ({ page }) => {
  await page.goto('/en/projects/welfare-state-seminar#executive-summary');
  await expect(page.locator('[data-project-details]')).toHaveAttribute('open', '');
  await expect(page.locator('#executive-summary')).toBeVisible();
});
