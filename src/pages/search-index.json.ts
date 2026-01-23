import { getLangFromUrl, useTranslations } from '@i18n/utils';
import { navigation, ui } from '@i18n/ui';
import portfolioData from '@data/portfolio.json';
import blogData from '@data/blog.json';
import skillsData from '@data/skills.json';

export async function GET(context) {
    const searchIndex = [];

    // Helper to add unique items
    const addedUrls = new Set();
    const addItem = (item) => {
        // We allow same URL if lang is different (but here URL is shared? No, they should differ usually, but /#anchors)
        // If we want to support same item in both languages, we'd need separate entries.
        // But for simpler filtering, we just add everything.
        // Note: addedUrls checks might prevent adding same URL for second language if they share URL.
        // Actually, da/en urls are different mostly.
        const key = item.url + '|' + item.lang;
        if (addedUrls.has(key)) return;
        searchIndex.push(item);
        addedUrls.add(key);
    };

    // 1. Pages from Navigation (DA)
    navigation.da.forEach(nav => {
        addItem({
            title: nav.label,
            url: nav.url,
            content: `Gå til ${nav.label} siden.`,
            tags: ['page'],
            lang: 'da'
        });
        if (nav.children) {
            nav.children.forEach(child => {
                addItem({
                    title: child.label,
                    url: child.url,
                    content: child.label,
                    tags: ['page', 'subpage'],
                    lang: 'da'
                });
            });
        }
    });

    // 2. Pages from Navigation (EN)
    navigation.en.forEach(nav => {
        addItem({
            title: nav.label,
            url: nav.url,
            content: `Go to ${nav.label} page.`,
            tags: ['page', 'en'],
            lang: 'en'
        });
        if (nav.children) {
            nav.children.forEach(child => {
                addItem({
                    title: child.label,
                    url: child.url,
                    content: child.label,
                    tags: ['page', 'subpage', 'en'],
                    lang: 'en'
                });
            });
        }
    });

    // 3. Portfolio Items (DA)
    portfolioData.forEach(item => {
        addItem({
            title: item.title,
            url: '/portfolio',
            content: item.description + " " + item.tools,
            tags: ['portfolio', 'project', item.tagString],
            lang: 'da'
        });
    });

    // 4. Blog Posts (DA)
    Object.values(blogData).flat().forEach((post: any) => {
        const url = post.links?.[0]?.url || '#';
        if (url === '#' || url.startsWith('#')) return;

        addItem({
            title: post.title,
            url: url,
            content: post.description || '',
            tags: ['blog', post.tag || ''],
            lang: 'da'
        });
    });

    // 5. Skills (DA)
    skillsData.programming.forEach(skill => {
        addItem({
            title: skill.name,
            url: '/cv#skills',
            content: `Erfaring med ${skill.name}. ${skill.title || ''}`,
            tags: ['skill', 'tool'],
            lang: 'da'
        });
    });

    return new Response(JSON.stringify(searchIndex), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
