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

export const navigation: { [key: string]: { label: string; url: string; children?: { label: string; url: string; external?: boolean }[] }[] } = {
    da: [
        { label: 'Hjem', url: '/' },
        {
            label: 'CV',
            url: '/cv',
            children: [
                { label: 'Profil', url: '/cv#profile' },
                { label: 'Erhvervserfaring', url: '/cv#experience' },
                { label: 'Uddannelse', url: '/cv#education' },
                { label: 'Kompetencer', url: '/cv#skills' },
                { label: 'Kurser', url: '/cv#courses' },
                { label: 'Certificeringer', url: '/cv#certifications' },
                { label: 'Organisationer', url: '/cv#organizations' },
                { label: 'Referencer', url: '/referencer' },
                { label: 'Milepæle', url: '/timeline' },
                { label: 'Video-CV', url: '/cv#video' }
            ]
        },
        {
            label: 'Portefølje',
            url: '/portfolio',
            children: [
                { label: 'Projekter', url: '/portfolio' },
                { label: 'Projekt-cases', url: '/portfolio#cases' },
                { label: 'Downloads', url: '/resources' },
                { label: 'Omtale', url: '/referencer' },
                { label: 'Noter', url: '/blog' },
                { label: 'Galleri', url: '/gallery' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Samarbejde', url: '/services' },
        { label: 'FAQ', url: '/faq' },
        { label: 'Blog', url: '/blog' },
        { label: 'Kontakt', url: '/contact' },
    ],
    en: [
        { label: 'Home', url: '/en' },
        {
            label: 'CV',
            url: '/en/cv',
            children: [
                { label: 'Profile', url: '/en/cv#profile' },
                { label: 'Experience', url: '/en/cv#experience' },
                { label: 'Education', url: '/en/cv#education' },
                { label: 'Skills', url: '/en/cv#skills' },
                { label: 'Courses', url: '/en/cv#courses' },
                { label: 'Certifications', url: '/en/cv#certifications' },
                { label: 'Organizations', url: '/en/cv#organizations' },
                { label: 'References', url: '/en/referencer' },
                { label: 'Milestones', url: '/timeline' },
                { label: 'Video CV', url: '/en/cv#video' }
            ]
        },
        {
            label: 'Portfolio',
            url: '/en/portfolio',
            children: [
                { label: 'Projects', url: '/en/portfolio' },
                { label: 'Case Studies', url: '/en/portfolio#cases' },
                { label: 'Downloads', url: '/resources' },
                { label: 'Mentions', url: '/en/referencer' },
                { label: 'Notes', url: '/en/blog' },
                { label: 'Gallery', url: '/gallery' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Services', url: '/en/services' },
        { label: 'FAQ', url: '/en/faq' },
        { label: 'Blog', url: '/en/blog' },
        { label: 'Contact', url: '/en/contact' },
    ]
};
