
import aboutData from '../../data/about.json';
import portfolioData from '../../data/portfolio.json';
import timelineData from '../../data/timeline.json';
import blogData from '../../data/blog.json';
import qaData from '../../data/qa.json';

export function buildSystemContext(lang: 'da' | 'en' = 'en'): string {
    const isDa = lang === 'da';

    // Choose the right language for bio/intro
    const bio = isDa ? aboutData.bio.da : aboutData.bio.en;
    const philosophy = isDa ? aboutData.philosophy.da : aboutData.philosophy.en;

    // Format Timeline (Experience)
    const timeline = timelineData.map(t => {
        const title = isDa ? t.title_da : t.title;
        const desc = isDa ? t.description_da : t.description;
        return `- [${t.year}] ${title} @ ${t.company || 'Self'}: ${desc}`;
    }).join('\n');

    // Format Projects
    const projects = portfolioData.map(p => {
        const title = isDa ? p.title_da : p.title;
        const desc = isDa ? p.description_da : p.description;
        return `- ${title} (${p.category}): ${desc}. Tech: ${p.tech?.join(', ')}`;
    }).join('\n');

    // Format QA (Common Questions)
    const qa = qaData.map(q => {
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
    - If you don't know something, say "I don't have that information, but you can contact Anton at anton.ebsen@gmail.com".
    - Answer in the language the user asks (${lang === 'da' ? 'Danish' : 'English'}).

    CONTEXT DATA:
    
    [BIO]
    ${bio}
    
    [PHILOSOPHY]
    ${philosophy}

    [EXPERIENCE]
    ${timeline}

    [PROJECTS]
    ${projects}

    [FAQ]
    ${qa}

    Start now.
    `;
}
