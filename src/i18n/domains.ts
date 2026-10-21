export type SiteLanguage = 'da' | 'en' | 'de';
export const languageOrigin = {
  da: 'https://antonebsen.dk',
  en: 'https://www.antonebsen.com',
  de: 'https://antonebsen.dk'
} as const;

export function isPublicSite(url: URL): boolean {
  return /^(www\.)?antonebsen\.(com|dk)$/.test(url.hostname);
}

/** English has a real /en namespace, so redirects never depend on rewriting
 * a statically generated Danish page. These are also the canonical SEO URLs. */
export function publicLanguageUrl(path: string, lang: SiteLanguage): string {
  const base = path.replace(/^\/(en|de)(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const localized = lang === 'da' ? base : `/${lang}${base === '/' ? '' : base}`;
  return languageOrigin[lang] + localized;
}

/** Keep local/preview navigation local; use the owned domains in production. */
export function languageSwitcherUrl(current: URL, targetPath: string, lang: SiteLanguage): string {
  return isPublicSite(current) ? publicLanguageUrl(targetPath, lang) : targetPath;
}
