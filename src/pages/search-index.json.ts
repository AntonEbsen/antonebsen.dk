import { getCollection, getEntry } from 'astro:content';
import { navigation } from '@i18n/ui';

import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
    const searchIndex: any[] = [];

    // Helper to add unique items
    const addedUrls = new Set();
    const addItem = (item: any) => {
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

    // 3. Portfolio Items (DA & EN)
    /*
    const portfolioDa = await getEntry('portfolio', 'da');
    const portfolioEn = await getEntry('portfolio', 'en');
    
    // Note: Use a loop or check if entries exist before processing
    // Implementation pending Portfolio update to generic collection or keeping separate
    // Assuming portfolio collection is still TODO or exists as 'portfolio' 
    // Checking previous 'src/data/portfolio.json' usage -> It was likely a single file.
    // If migrated to collections, it would be 'src/content/portfolio'
    
    // For now, removing broken legacy import.
    // TODO: Re-integrate portfolio search when collection is fully standardized.
    */

    // 4. Blog Posts
    const blogPosts = await getCollection('blog');
    blogPosts.forEach(post => {
        // Checking if it has legacy structure or new
        const url = `/blog/${post.id}`; // using id as slug usually works or filePath processing

        addItem({
            title: post.data.title,
            url: url,
            content: post.data.description || '',
            tags: ['blog', post.data.tag || ''],
            lang: 'da' // Assuming blog is mostly DA or mixed? Defaulting DA for now or checking category
        });
    });

    // 5. Skills (DA & EN)
    const skillsDa = await getEntry('skills', 'da');
    if (skillsDa && skillsDa.data.programming) {
        skillsDa.data.programming.forEach(skill => {
            addItem({
                title: skill.name,
                url: '/cv#skills',
                content: `Erfaring med ${skill.name}. ${skill.title || ''}`,
                tags: ['skill', 'tool'],
                lang: 'da'
            });
        });
    }

    const skillsEn = await getEntry('skills', 'en');
    if (skillsEn && skillsEn.data.programming) {
        skillsEn.data.programming.forEach(skill => {
            addItem({
                title: skill.name,
                url: '/en/cv#skills',
                content: `Experience with ${skill.name}. ${skill.title || ''}`,
                tags: ['skill', 'tool', 'en'],
                lang: 'en'
            });
        });
    }

    return new Response(JSON.stringify(searchIndex), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};
