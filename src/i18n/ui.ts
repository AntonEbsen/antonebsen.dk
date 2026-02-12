export const languages = {
    da: 'Dansk',
    en: 'English',
    de: 'Deutsch',
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
        'nav.insights': 'Indsigter',
        'nav.more': 'Mere',
        'nav.lab': 'Forsknings-lab',
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
        'nav.insights': 'Insights',
        'nav.more': 'More',
        'nav.lab': 'Research Lab',
        'nav.contact': 'Contact',

        'footer.brand.title': 'Anton Meier Ebsen Jørgensen',
        'footer.brand.text': 'Economics student (cand.polit) focusing on macroeconomics, econometrics, and economic modeling. I build analyses and templates for practical use.',

        'footer.col.links': 'Links',
        'footer.col.selected': 'Selected',
        'footer.col.contact': 'Contact',
    },
    de: {
        'nav.home': 'Startseite',
        'nav.cv': 'Lebenslauf',
        'nav.portfolio': 'Portfolio',
        'nav.services': 'Zusammenarbeit',
        'nav.referencer': 'Referenzen',
        'nav.faq': 'FAQ',
        'nav.blog': 'Blog',
        'nav.insights': 'Einblicke',
        'nav.more': 'Mehr',
        'nav.lab': 'Forschungslabor',
        'nav.contact': 'Kontakt',

        'footer.brand.title': 'Anton Meier Ebsen Jørgensen',
        'footer.brand.text': 'Wirtschaftsstudent (cand.polit.) mit Fokus auf Makroökonomie, Ökonometrie und ökonomische Modelle. Ich erstelle Analysen und Vorlagen für die Praxis.',

        'footer.col.links': 'Links',
        'footer.col.selected': 'Ausgewählt',
        'footer.col.contact': 'Kontakt',
    },
} as const;

export const navigation: { [key: string]: { label: string; url: string; children?: { label: string; url: string; external?: boolean }[] }[] } = {
    da: [
        { label: 'Hjem', url: '/' },
        {
            label: 'CV',
            url: '/cv',
            children: [
                { label: 'Profil', url: '/about' },
                { label: 'Erhvervserfaring', url: '/experience' },
                { label: 'Uddannelse', url: '/education' },
                { label: 'Kompetencer', url: '/skills' },
                { label: 'Milepæle', url: '/timeline' },
                { label: 'Hvad laver jeg nu?', url: '/now' }
            ]
        },
        {
            label: 'Portefølje',
            url: '/portfolio',
            children: [
                { label: 'Projekter', url: '/portfolio' },
                { label: 'Policy Arkiv', url: '/archive' },
                { label: 'Model Library', url: '/models' },
                { label: 'Speaking', url: '/speaking' },
                { label: 'Economic Toolkit', url: '/toolkit' },
                { label: 'Bibliography', url: '/bibliography' },
                { label: 'Data Resource Map', url: '/data-map' },
                { label: 'Downloads', url: '/resources' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Blog', url: '/blog' },
        {
            label: 'Kontakt',
            url: '/contact',
            children: [
                { label: 'Samarbejde', url: '/services' },
                { label: 'Q&A', url: '/qa' },
                { label: 'Kontakt mig', url: '/contact' }
            ]
        },
    ],
    en: [
        { label: 'Home', url: '/en' },
        {
            label: 'CV',
            url: '/en/cv',
            children: [
                { label: 'Profile', url: '/en/about' },
                { label: 'Experience', url: '/en/experience' },
                { label: 'Education', url: '/en/education' },
                { label: 'Skills', url: '/en/skills' },
                { label: 'Milestones', url: '/en/timeline' },
                { label: 'What I\'m doing now', url: '/en/now' }
            ]
        },
        {
            label: 'Portfolio',
            url: '/en/portfolio',
            children: [
                { label: 'Projects', url: '/en/portfolio' },
                { label: 'Policy Archive', url: '/en/archive' },
                { label: 'Model Library', url: '/en/models' },
                { label: 'Speaking', url: '/en/speaking' },
                { label: 'Economic Toolkit', url: '/en/toolkit' },
                { label: 'Bibliography', url: '/en/bibliography' },
                { label: 'Data Resource Map', url: '/en/data-map' },
                { label: 'Downloads', url: '/en/resources' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Blog', url: '/en/blog' },
        {
            label: 'Contact',
            url: '/en/contact',
            children: [
                { label: 'Services', url: '/en/services' },
                { label: 'Q&A', url: '/en/qa' },
                { label: 'Contact me', url: '/en/contact' }
            ]
        },
    ],
    de: [
        { label: 'Start', url: '/de' },
        {
            label: 'Lebenslauf',
            url: '/de/cv',
            children: [
                { label: 'Profil', url: '/de/about' },
                { label: 'Erfahrung', url: '/de/experience' },
                { label: 'Bildung', url: '/de/education' },
                { label: 'Kompetenzen', url: '/de/skills' },
                { label: 'Meilensteine', url: '/de/timeline' },
                { label: 'Was ich gerade mache', url: '/de/now' }
            ]
        },
        {
            label: 'Portfolio',
            url: '/de/portfolio',
            children: [
                { label: 'Projekte', url: '/de/portfolio' },
                { label: 'Model Library', url: '/en/models' },
                { label: 'Speaking', url: '/en/speaking' },
                { label: 'Economic Toolkit', url: '/de/toolkit' },
                { label: 'Bibliografie', url: '/de/bibliography' },
                { label: 'Data Resource Map', url: '/de/data-map' },
                { label: 'Downloads', url: '/de/resources' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Blog', url: '/de/blog' },
        {
            label: 'Kontakt',
            url: '/de/contact',
            children: [
                { label: 'Dienstleistungen', url: '/de/services' },
                { label: 'Q&A', url: '/de/qa' },
                { label: 'Kontaktieren Sie mich', url: '/de/contact' }
            ]
        },
    ]
};
