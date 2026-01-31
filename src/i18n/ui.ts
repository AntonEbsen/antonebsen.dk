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
        'nav.lab': 'Research Lab',
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
                { label: 'Profil', url: '/about' },
                { label: 'Modgang & Målrettethed', url: '/modgang-og-maalrettethed' },
                { label: 'Erhvervserfaring', url: '/experience' },
                { label: 'Uddannelse', url: '/education' },
                { label: 'Case: ECB Taylor Rules', url: '/projects/ecb-taylor-rules' },
                { label: 'Case: Fremtidens monetære system', url: '/projects/future-monetary-system' },
                { label: 'Case: Valutakursdynamik', url: '/projects/exchange-rate-dynamics' },
                { label: 'Kompetencer', url: '/skills' },
                { label: 'Kurser', url: '/courses' },
                { label: 'Certificeringer', url: '/certifications' },
                { label: 'Organisationer', url: '/organizations' },
                { label: 'Referencer', url: '/referencer' },
                { label: 'Milepæle', url: '/timeline' },
                { label: 'Video-CV', url: '/video-cv' },
                { label: 'Hvad laver jeg nu?', url: '/now' },
                { label: 'Værdier & Etik', url: '/values' },
                { label: 'Personlighedsprofil', url: '/personality' },
                { label: 'SWOT Analyse', url: '/swot' },
                { label: 'Anti-CV', url: '/anti-resume' },
                { label: 'Ting jeg ikke gør', url: '/anti-goals' },
                { label: 'Årsreview 2025', url: '/2025' },
                { label: 'Breve', url: '/letters' }
            ]
        },
        {
            label: 'Portefølje',
            url: '/portfolio',
            children: [
                { label: 'Projekter', url: '/portfolio' },
                { label: 'Projekt-cases', url: '/cases' },
                { label: 'Downloads', url: '/resources' },
                { label: 'Omtale', url: '/media' },
                { label: 'Noter', url: '/notes' },
                { label: 'Galleri', url: '/gallery' },
                { label: 'Mit Setup (/uses)', url: '/uses' },
                { label: 'Økonomisk Filosofi', url: '/finance' },
                { label: 'Case: Global Financial Cycle', url: '/projects/global-financial-cycle' },
                { label: 'Case: ECB Taylor Rules', url: '/projects/ecb-taylor-rules' },
                { label: 'Case: Fremtidens monetære system', url: '/projects/future-monetary-system' },
                { label: 'Case: Valutakursdynamik', url: '/projects/exchange-rate-dynamics' },
                { label: 'Forsknings-lab', url: '/research/lab/index.html', external: true },
                { label: 'API Protokol', url: '/api-docs' },
                { label: 'Sundhedsprotokol', url: '/health' },
                { label: 'Om Antons AI', url: '/ai-project' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Samarbejde', url: '/services' },
        { label: 'Q&A', url: '/qa' },
        { label: 'Blog', url: '/blog' },
        { label: 'Kontakt', url: '/contact' },
    ],
    en: [
        { label: 'Home', url: '/en' },
        {
            label: 'CV',
            url: '/en/cv',
            children: [
                { label: 'Profile', url: '/en/about' },
                { label: 'Adversity & Resilience', url: '/en/modgang-og-maalrettethed' },
                { label: 'Experience', url: '/en/experience' },
                { label: 'Education', url: '/en/education' },
                { label: 'Case: ECB Taylor Rules', url: '/en/projects/ecb-taylor-rules' },
                { label: 'Case: Future of Monetary System', url: '/en/projects/future-monetary-system' },
                { label: 'Case: Exchange Rate Dynamics', url: '/en/projects/exchange-rate-dynamics' },
                { label: 'Skills', url: '/en/skills' },
                { label: 'Courses', url: '/en/courses' },
                { label: 'Certifications', url: '/en/certifications' },
                { label: 'Organizations', url: '/en/organizations' },
                { label: 'Testimonials', url: '/en/referencer' },
                { label: 'Milestones', url: '/en/timeline' },
                { label: 'Video CV', url: '/en/video-cv' },
                { label: 'What I\'m doing now', url: '/en/now' },
                { label: 'Values & Ethics', url: '/en/values' },
                { label: 'Personality Profile', url: '/en/personality' },
                { label: 'Strategic SWOT', url: '/en/swot' },
                { label: 'Anti-Resume', url: '/en/anti-resume' },
                { label: 'Things I Don\'t Do', url: '/en/anti-goals' },
                { label: '2025 Review', url: '/en/2025' },
                { label: 'Letters', url: '/en/letters' }
            ]
        },
        {
            label: 'Portfolio',
            url: '/en/portfolio',
            children: [
                { label: 'Projects', url: '/en/portfolio' },
                { label: 'Case Studies', url: '/en/cases' },
                { label: 'Downloads', url: '/en/resources' },
                { label: 'Press', url: '/en/media' },
                { label: 'Notes', url: '/en/notes' },
                { label: 'Gallery', url: '/en/gallery' },
                { label: 'My Setup (/uses)', url: '/en/uses' },
                { label: 'Finance Philosophy', url: '/en/finance' },
                { label: 'Case: Global Financial Cycle', url: '/en/projects/global-financial-cycle' },
                { label: 'Case: ECB Taylor Rules', url: '/en/projects/ecb-taylor-rules' },
                { label: 'Case: Future of Monetary System', url: '/en/projects/future-monetary-system' },
                { label: 'Case: Exchange Rate Dynamics', url: '/en/projects/exchange-rate-dynamics' },
                { label: 'Research Lab', url: '/research/lab/index.html', external: true },
                { label: 'API Protocol', url: '/en/api-docs' },
                { label: 'Health Protocol', url: '/en/health' },
                { label: "About Anton's AI", url: '/en/ai-project' },
                { label: 'GitHub', url: 'https://github.com/AntonEbsen', external: true }
            ]
        },
        { label: 'Services', url: '/en/services' },
        { label: 'Q&A', url: '/en/qa' },
        {
            label: 'Blog',
            url: '/en/blog',
            children: [
                { label: 'Latest Posts', url: '/en/blog' },
                { label: 'Bucket List', url: '/en/bucketlist' },
                { label: 'Library (Books)', url: '/en/books' },
                { label: 'Podcasts', url: '/en/podcasts' },
                { label: 'Favorite Quotes', url: '/en/quotes' }
            ]
        },
        { label: 'Contact', url: '/en/contact' },
    ]
};
