import { getCollection } from 'astro:content';

export const prerender = false;

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function GET() {
    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Root Node
    nodes.push({ id: 'Anton', group: 'root', val: 25, color: '#D4AF37' });

    // Categories
    const categories = [
        { id: 'Skills', color: '#60A5FA' },
        { id: 'Projects', color: '#F59E0B' },
        { id: 'Experience', color: '#A1A1AA' },
        { id: 'Blog', color: '#F472B6' }
    ];

    categories.forEach(cat => {
        nodes.push({ id: cat.id, group: 'category', val: 18, color: cat.color });
        links.push({ source: 'Anton', target: cat.id, value: 5 });
    });

    // Fetch data
    const skillsColl = await getCollection('skills');
    const daSkills = skillsColl.find(s => s.id === 'da')?.data;

    const blogPosts = await getCollection('blog');
    const portfolio = await getCollection('portfolio');
    const cv = await getCollection('cv');
    const daCV = cv.find(c => c.id === 'da')?.data;

    // 2. Skills
    const allSkills: Set<string> = new Set();
    if (daSkills) {
        const skillItems = [...(daSkills.professional || []), ...(daSkills.programming || [])];
        skillItems.forEach(skill => {
            const name = skill.name.replace(/ \(.*\)/, '');
            if (!allSkills.has(name)) {
                allSkills.add(name);
                nodes.push({ id: name, group: 'skill', val: 10, color: '#60A5FA' });
                links.push({ source: 'Skills', target: name, value: 2 });
            }
        });
    }

    // 3. Projects
    portfolio.forEach(proj => {
        const id = proj.data.title;
        nodes.push({
            id: id,
            group: 'project',
            val: 14,
            color: '#F59E0B',
            url: `/projects/${proj.id}`
        });
        links.push({ source: 'Projects', target: id, value: 3 });

        // Link to skills
        if (proj.data.tools) {
            const tools = proj.data.tools.split(/[,·/]/).map(t => t.trim());
            tools.forEach(tool => {
                const toolNorm = normalize(tool);
                const match = Array.from(allSkills).find(s => normalize(s).includes(toolNorm) || toolNorm.includes(normalize(s)));
                if (match) links.push({ source: id, target: match, value: 1 });
            });
        }
    });

    // 4. Blog Posts
    blogPosts.forEach(post => {
        const id = post.data.title_da || post.data.title;
        nodes.push({
            id: id,
            group: 'blog',
            val: 12,
            color: '#F472B6',
            url: `/blog/${post.id}`
        });
        links.push({ source: 'Blog', target: id, value: 2 });

        // Link to tags/skills
        if (post.data.tag) {
            const tags = post.data.tag.split(/[,·/]/).map(t => t.trim());
            tags.forEach(tag => {
                const tagNorm = normalize(tag);
                const match = Array.from(allSkills).find(s => normalize(s).includes(tagNorm) || tagNorm.includes(normalize(s)));
                if (match) links.push({ source: id, target: match, value: 1 });
            });
        }

        // Link to projects
        if (post.data.relatedProjectId) {
            const related = portfolio.find(p => p.id === post.data.relatedProjectId);
            if (related) {
                links.push({ source: id, target: related.data.title, value: 4 });
            }
        }
    });

    // 5. Experience
    if (daCV?.experience) {
        daCV.experience.forEach(exp => {
            const id = exp.organization;
            nodes.push({ id: id, group: 'experience', val: 14, color: '#A1A1AA' });
            links.push({ source: 'Experience', target: id, value: 3 });

            if (exp.technologies) {
                exp.technologies.forEach(tech => {
                    const techNorm = normalize(tech);
                    const match = Array.from(allSkills).find(s => normalize(s).includes(techNorm) || techNorm.includes(normalize(s)));
                    if (match) links.push({ source: id, target: match, value: 1 });
                });
            }
        });
    }

    return new Response(JSON.stringify({ nodes, links }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
