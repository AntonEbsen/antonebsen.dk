import { getLangFromUrl, useTranslations } from '@i18n/utils';
import { navigation, ui } from '@i18n/ui'; // Check imports
import portfolioData from '@data/portfolio.json';
import blogData from '@data/blog.json';
import skillsData from '@data/skills.json';

export async function GET(context) {
    const searchIndex = [];

    // 1. Pages from Navigation (Danish as default for now, or mix)
    // We'll add both DA and EN pages logic if simpler, or just mapped items.
    // Converting 'navigation.da' to search items

    // Helper to add unique items
    const addedUrls = new Set();
    const addItem = (item) => {
        if (addedUrls.has(item.url)) return;
        searchIndex.push(item);
        addedUrls.add(item.url);
    };

    // Static Pages (DA)
    navigation.da.forEach(nav => {
        addItem({
            title: nav.label,
            url: nav.url,
            content: `Gå til ${nav.label} siden.`,
            tags: ['page']
        });
        if (nav.children) {
            nav.children.forEach(child => {
                addItem({
                    title: child.label,
                    url: child.url,
                    content: child.label,
                    tags: ['page', 'subpage']
                });
            });
        }
    });

    // Static Pages (EN)
    navigation.en.forEach(nav => {
        addItem({
            title: `${nav.label} (EN)`,
            url: nav.url,
            content: `Go to ${nav.label} page.`,
            tags: ['page', 'en']
        });
        if (nav.children) {
            nav.children.forEach(child => {
                addItem({
                    title: child.label,
                    url: child.url,
                    content: child.label,
                    tags: ['page', 'subpage', 'en']
                });
            });
        }
    });

    // 2. Portfolio Items
    portfolioData.forEach(item => {
        addItem({
            title: item.title,
            url: '/portfolio', // or specific link if they have detailed pages? Portfolio.json has 'links' but maybe not separate pages? 
            // The user has subpages now: /gallery, /timeline. 
            // But main items are on /portfolio.
            content: item.description + " " + item.tools,
            tags: ['portfolio', 'project', item.tagString]
        });
    });

    // 3. Blog Posts
    // 3. Blog Posts (blogData is an object with categories)
    Object.values(blogData).flat().forEach((post: any) => {
        const url = post.links?.[0]?.url || '#';
        if (url === '#' || url.startsWith('#')) return; // Skip posts without real links if desired, or include them?

        addItem({
            title: post.title,
            url: url,
            content: post.description || '',
            tags: ['blog', post.tag || '']
        });
    });

    // 4. Skills (Optional)
    skillsData.programming.forEach(skill => {
        // Link to CV or Home?
        addItem({
            title: skill.name,
            url: '/cv#skills',
            content: `Erfaring med ${skill.name}. ${skill.title || ''}`,
            tags: ['skill', 'tool']
        });
    });

    return new Response(JSON.stringify(searchIndex), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
