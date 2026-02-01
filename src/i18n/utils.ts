import { ui, defaultLang, navigation } from './ui';

export function getLangFromUrl(url: URL) {
    const [, lang] = url.pathname.split('/');
    if (lang in ui) return lang as keyof typeof ui;
    return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
    return function t(key: keyof typeof ui[typeof defaultLang]) {
        if (!ui[lang]) return ui[defaultLang][key];
        return ui[lang][key] || ui[defaultLang][key];
    }
}

export function useNav(lang: keyof typeof ui) {
    return navigation[lang] || navigation[defaultLang];
}
