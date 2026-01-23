export const languages = {
    da: 'Dansk',
    en: 'English',
};

export const defaultLang = 'da';

export const ui = {
    da: {
        'nav.home': 'Hjem',
        'nav.cv': 'CV',
        'nav.portfolio': 'Portefølje',
        'nav.services': 'Samarbejde',
        'nav.referencer': 'Referencer',
        'nav.faq': 'FAQ',
        'nav.blog': 'Blog',
        'nav.contact': 'Kontakt',

        'footer.brand.title': 'Anton Meier Ebsen Jørgensen',
        'footer.brand.text': 'Økonomistuderende (cand.polit.) med fokus på makroøkonomi, økonometri og økonomiske modeller. Jeg bygger analyser og templates, der kan bruges i praksis.',

        'footer.col.links': 'Links',
        'footer.col.selected': 'Udvalgt',
        'footer.col.contact': 'Kontakt',
    },
    en: {
        'nav.home': 'Home',
        'nav.cv': 'CV',
        'nav.portfolio': 'Portfolio',
        'nav.services': 'Services',
        'nav.referencer': 'Testimonials',
        'nav.faq': 'FAQ',
        'nav.blog': 'Blog',
        'nav.contact': 'Contact',

        'footer.brand.title': 'Anton Meier Ebsen Jørgensen',
        'footer.brand.text': 'Economics student (cand.polit) focusing on macroeconomics, econometrics, and economic modeling. I build analyses and templates for practical use.',

        'footer.col.links': 'Links',
        'footer.col.selected': 'Selected',
        'footer.col.contact': 'Contact',
    },
} as const;

export const navigation = {
    da: [
        { label: 'Hjem', url: '/' },
        { label: 'CV', url: '/cv' }, // Dropdowns can be added later if needed or hardcoded in menu
        { label: 'Portefølje', url: '/portfolio' },
        { label: 'Samarbejde', url: '/services' },
        { label: 'Referencer', url: '/referencer' },
        { label: 'FAQ', url: '/faq' },
        { label: 'Blog', url: '/blog' },
        { label: 'Kontakt', url: '/contact' },
    ],
    en: [
        { label: 'Home', url: '/en' },
        { label: 'CV', url: '/en/cv' },
        { label: 'Portfolio', url: '/en/portfolio' },
        { label: 'Services', url: '/en/services' },
        { label: 'Testimonials', url: '/en/referencer' },
        { label: 'FAQ', url: '/en/faq' },
        { label: 'Blog', url: '/en/blog' },
        { label: 'Contact', url: '/en/contact' },
    ]
};
