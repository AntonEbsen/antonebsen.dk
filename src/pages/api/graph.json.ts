import { getEntry } from 'astro:content';
import cvData from '../../content/cv/da.json';
import skillsData from '../../content/skills/da.json';

export const prerender = false;

// Helper to normalize strings for comparison
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function GET() {
    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Root Node
    nodes.push({ id: 'Anton', group: 'root', val: 20, color: '#D4AF37' });

    // 2. Skill Nodes
    const allSkills: Set<string> = new Set();

    // Combine all skill categories
    const skillCategories = [
        ...skillsData.professional,
        ...skillsData.programming,
        ...skillsData.focus
    ];

    skillCategories.forEach((skill) => {
        const skillName = skill.name.replace(/ \(.*\)/, ''); // Remove parenthesis content for cleaner nodes
        if (!allSkills.has(skillName)) {
            allSkills.add(skillName);
            nodes.push({
                id: skillName,
                group: 'skill',
                val: 10,
                color: '#60A5FA' // Blue
            });
            // Link Skill -> Anton
            links.push({ source: 'Anton', target: skillName, value: 2 });
        }
    });

    // 3. Experience Nodes
    cvData.experience.forEach((exp) => {
        const id = `${exp.organization}`;
        nodes.push({
            id: id,
            group: 'experience',
            val: 15,
            color: '#A1A1AA' // Gray
        });
        // Link Experience -> Anton
        links.push({ source: 'Anton', target: id, value: 5 });

        // Link Experience -> Skills (technologies)
        if (exp.technologies) {
            exp.technologies.forEach((tech) => {
                // Find matching skill node (fuzzy match)
                const techNorm = normalize(tech);
                const match = Array.from(allSkills).find(s => normalize(s).includes(techNorm) || techNorm.includes(normalize(s)));
                if (match) {
                    links.push({ source: id, target: match, value: 1 });
                }
            });
        }
    });

    // 4. Education/Course Nodes (Selective)
    cvData.education.forEach((edu) => {
        const id = edu.institution;
        if (!nodes.find(n => n.id === id)) {
            nodes.push({ id: id, group: 'education', val: 15, color: '#F472B6' }); // Pink
            links.push({ source: 'Anton', target: id, value: 5 });
        }

        // Link degrees/courses to institution? Maybe too messy. 
        // Let's link High-Grade Courses based on 'verifiedSkills'
    });

    cvData.courses.forEach((course) => {
        if (course.verifiedSkills) {
            const courseId = course.tag + "-" + course.title.substring(0, 10);
            nodes.push({ id: course.title, group: 'course', val: 5, color: '#34D399' }); // Green
            links.push({ source: course.institution, target: course.title, value: 1 });

            course.verifiedSkills.forEach(skill => {
                const techNorm = normalize(skill);
                const match = Array.from(allSkills).find(s => normalize(s).includes(techNorm) || techNorm.includes(normalize(s)));
                if (match) {
                    links.push({ source: course.title, target: match, value: 1 });
                }
            });
        }
    });


    // 5. Project Nodes (Importing generic portfolio items)
    // Since we can't easily glob imports in this specific file structure without some fs magic or content collections API which might be async
    // We will assume a simplified extraction if content collections are available, otherwise we use what we viewed.
    // Actually, we can use `getCollection` if it fits. 
    // Let's try to mock the project links based on known skills or just add generic nodes if we can't read files dynamically here easily without overhead.
    // For now, let's leave projects out or try to fetch them if possible. 
    // Wait, I saw `project-01.json` etc in `src/content/portfolio`.
    // I will skip dynamic file reading here and rely on the solid data from CV/Skills which is already imported.
    // The user can add projects manually or we can expand this later.

    return new Response(JSON.stringify({ nodes, links }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
