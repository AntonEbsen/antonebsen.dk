
import aboutData from '../../data/about.json';
import portfolioData from '../../data/portfolio.json';
import timelineData from '../../data/timeline.json';
import blogData from '../../data/blog.json';
import qaData from '../../data/qa.json';
import type { TimelineItem, ProjectItem, QAItem, QARoot } from '../../types/content';

export function buildSystemContext(lang: 'da' | 'en' = 'en'): string {
    const isDa = lang === 'da';

    // About Data Mapping
    // The JSON structure is different from what was previously assumed.
    // We map 'hero.lead' to bio and 'focus' to philosophy/interests.
    const bio = aboutData.hero.lead;
    const philosophy = aboutData.focus.map(f => `${f.title}: ${f.description}`).join('; ');

    // Format Timeline (Experience)
    const timeline = (timelineData as TimelineItem[]).map(t => {
        const title = isDa ? t.title_da : t.title_en;
        const desc = isDa ? t.desc_da : t.desc_en;
        const role = "Anton"; // Or extract if available
        return `- [${t.year}] ${title}: ${desc}`;
    }).join('\n');

    // Format Projects
    // Portfolio JSON is single-language (English/Danish mix) or agnostic
    const projects = (portfolioData as ProjectItem[]).map(p => {
        return `- ${p.title} (${p.tagString}): ${p.description}. Tools: ${p.tools}`;
    }).join('\n');

    // Format QA (Common Questions)
    const qaList = (qaData as QARoot).pinned;
    const qa = qaList.map(q => {
        const question = isDa ? q.q_da : q.q_en;
        const answer = isDa ? q.a_da : q.a_en;
        return `Q: ${question}\nA: ${answer}`;
    }).join('\n\n');

    return `
    You are an AI assistant representing Anton Meier Ebsen Jørgensen on his portfolio website.
    Your goal is to answer questions about Anton's professional experience, skills, and projects accurately.

    TONE:
    - Professional but friendly.
    - Confident but humble.
    - Concise. Do not ramble.
    - If you don’t know something, say "I don’t know" or suggest checking the CV page.
    - Respond in ${isDa ? 'Danish' : 'English'}.

    CORE INFO:
    - Name: Anton Meier Ebsen Jørgensen
    - Role: Student (cand.oecon), Teaching Assistant (Excel/VBA), Data Enthusiast.
    - Location: ${aboutData.quickfacts.find(q => q.icon.includes('location'))?.text || 'København'}
    - Bio: ${bio}
    - Key Interests/Philosophy: ${philosophy}

    EXPERIENCE (Timeline):
    ${timeline}

    PROJECTS & CASE STUDIES:
    ${projects}

    COMMON Q&A:
    ${qa}

    INSTRUCTIONS:
    - Use the above data to answer the user's question.
    - If asked about "Who is Anton?", summarize the Bio and key roles.
    - If asked about specific tools, reference the Projects section.
    - Keep answers under 3-4 sentences unless asked for detail.
    `;
}
