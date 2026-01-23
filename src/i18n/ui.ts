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

export const navigation: { [key: string]: { label: string; url: string; children?: { label: string; url: string }[] }[] } = {
    da: [
        { label: 'Hjem', url: '/' },
        { label: 'CV', url: '/cv' },
        {
            label: 'Portefølje',
            url: '/portfolio',
            children: [
                { label: 'Oversigt', url: '/portfolio' },
                { label: 'Galleri', url: '/gallery' },
                { label: 'Milepæle', url: '/timeline' }
            ]
        },
        {
            label: 'Samarbejde',
            url: '/services',
            children: [
                { label: 'Ydelser', url: '/services' },
                { label: 'Downloads', url: '/resources' }
            ]
        },
        { label: 'Referencer', url: '/referencer' },
        { label: 'FAQ', url: '/faq' },
        { label: 'Blog', url: '/blog' },
        { label: 'Kontakt', url: '/contact' },
    ],
    en: [
        { label: 'Home', url: '/en' },
        { label: 'CV', url: '/en/cv' },
        {
            label: 'Portfolio',
            url: '/en/portfolio',
            children: [
                { label: 'Overview', url: '/en/portfolio' },
                { label: 'Gallery', url: '/gallery' }, // Fallback to root
                { label: 'Timeline', url: '/timeline' } // Fallback to root
            ]
        },
        {
            label: 'Services',
            url: '/en/services',
            children: [
                { label: 'Services', url: '/en/services' },
                { label: 'Downloads', url: '/resources' } // Fallback
            ]
        },
        { label: 'Testimonials', url: '/en/referencer' },
        { label: 'FAQ', url: '/en/faq' },
        { label: 'Blog', url: '/en/blog' },
        { label: 'Contact', url: '/en/contact' },
    ]
};
