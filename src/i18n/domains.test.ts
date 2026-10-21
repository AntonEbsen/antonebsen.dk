import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getTransformedRoutes } from '@vercel/routing-utils';
import { getLangFromUrl } from './utils';
import { languageSwitcherUrl, publicLanguageUrl } from './domains';

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
// Use the routing converter already installed by the Vercel adapter, rather
// than a hand-written approximation of Vercel's source-pattern syntax.
const converted = getTransformedRoutes({ redirects: config.redirects });
function redirect(input: string): string | null {
  const url = new URL(input);
  for (const route of converted.routes || []) {
    if (!('src' in route) || !route.headers?.Location) continue;
    if (route.has?.some(condition => condition.type !== 'host' || condition.value !== url.hostname)) continue;
    const expression = new RegExp(route.src);
    if (expression.test(url.pathname)) return url.pathname.replace(expression, route.headers.Location);
  }
  return null;
}

describe('production domain routing', () => {
  it('is accepted by the Vercel route converter', () => {
    expect(converted.error).toBeNull();
    expect(config.rewrites).toBeUndefined();
  });
  it.each(['antonebsen.com', 'www.antonebsen.com'])('%s opens English', host => {
    expect(redirect(`https://${host}/`)).toBe('https://www.antonebsen.com/en');
    expect(getLangFromUrl(new URL(`https://${host}/`))).toBe('en');
  });
  it('keeps Danish on .dk, including www', () => {
    expect(redirect('https://antonebsen.dk/')).toBeNull();
    expect(redirect('https://www.antonebsen.dk/')).toBe('https://antonebsen.dk/');
    expect(getLangFromUrl(new URL('https://www.antonebsen.dk/'))).toBe('da');
  });
  it('sends clean .com page links to the real English namespace', () => {
    expect(redirect('https://antonebsen.com/cv')).toBe('https://www.antonebsen.com/en/cv');
    expect(redirect('https://antonebsen.com/projects/demography-project')).toBe('https://www.antonebsen.com/en/projects/demography-project');
    expect(redirect('https://antonebsen.com/enlightenment')).toBe('https://www.antonebsen.com/en/enlightenment');
  });
  it('preserves existing English links without /en/en loops', () => {
    for (const path of ['/en', '/en/cv', '/en/projects/demography-project']) {
      expect(redirect(`https://antonebsen.com${path}`)).toBeNull();
    }
    expect(redirect('https://antonebsen.dk/en')).toBe('https://www.antonebsen.com/en');
    expect(redirect('https://antonebsen.dk/en/cv')).toBe('https://www.antonebsen.com/en/cv');
    expect(redirect('https://www.antonebsen.com/en')).toBeNull();
    expect(redirect('https://www.antonebsen.com/en/cv')).toBeNull();
    expect(redirect('https://www.antonebsen.com/cv')).toBe('https://www.antonebsen.com/en/cv');
  });
  it.each(['/api', '/api/now', '/assets/docs/paper.pdf', '/_astro/app.js', '/research/index.html', '/_vercel/insights/script.js', '/search-index.json', '/robots.txt', '/sitemap-index.xml', '/de/cv'])('does not redirect shared resource %s', path => {
    expect(redirect(`https://antonebsen.com${path}`)).toBeNull();
  });
  it('keeps previews local and switches owned domains by language', () => {
    expect(languageSwitcherUrl(new URL('https://antonebsen.com/en/cv'), '/cv', 'da')).toBe('https://antonebsen.dk/cv');
    expect(languageSwitcherUrl(new URL('https://antonebsen.dk/cv'), '/en/cv', 'en')).toBe('https://www.antonebsen.com/en/cv');
    expect(languageSwitcherUrl(new URL('http://localhost:4321/cv'), '/en/cv', 'en')).toBe('/en/cv');
    expect(languageSwitcherUrl(new URL('https://preview.vercel.app/cv'), '/en/cv', 'en')).toBe('/en/cv');
  });
  it('uses the same English URLs for canonical metadata and navigation', () => {
    expect(publicLanguageUrl('/en/cv/', 'en')).toBe('https://www.antonebsen.com/en/cv');
    expect(publicLanguageUrl('/en/videos/series/italy-2026', 'en')).toBe('https://www.antonebsen.com/en/videos/series/italy-2026');
    expect(publicLanguageUrl('/cv', 'da')).toBe('https://antonebsen.dk/cv');
    expect(publicLanguageUrl('/de/cv', 'de')).toBe('https://antonebsen.dk/de/cv');
    expect(getLangFromUrl(new URL('https://antonebsen.com/de/cv'))).toBe('de');
    expect(getLangFromUrl(new URL('https://antonebsen.dk/constructor'))).toBe('da');
  });
});
