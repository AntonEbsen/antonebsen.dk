/**
 * The assistant's knowledge, built once per language.
 *
 * This replaces `getBioContext` in /api/chat, which had two problems worth naming:
 *
 *  - It fed the model blog *descriptions* only. The bodies never reached it, so the
 *    one thing this site should be able to answer — what Anton actually argued in an
 *    essay — was the one thing it could not.
 *  - It served the English CV to German visitors. All three languages have a full CV,
 *    skills file and Q&A, so German now gets German.
 *
 * Content is read with `import.meta.glob` rather than `getCollection`, so the module
 * is a plain function with no Astro runtime behind it and can be unit-tested directly.
 * The trade-off is that collection Zod schemas are not applied here; this is a
 * read-only projection into a prompt, and every field is treated as optional.
 *
 * Every entry carries a stable source id (`blog:welfare-part-1`, `cv:experience:0`)
 * and, where a route exists, the URL it lives at. That is what makes citations
 * resolvable: the model names an id, and the server turns it into a real link.
 */

import { resolveTranscript } from '../video-transcript';
import { formatTimestamp } from '../transcript';

export type Lang = 'en' | 'da' | 'de';

/** Per-video ceiling on transcript text, in characters (~1.5k tokens). */
const TRANSCRIPT_CHAR_CAP = 6000;

/**
 * Render transcript paragraphs for the prompt.
 *
 * Timestamps go in the text rather than the URL because the video page seeks via a
 * click handler on its chapter list and reads nothing from the address bar — a `#t=`
 * link would land on the page without moving the player. Carrying the time inline lets
 * the assistant say "around 4:32" and be right.
 *
 * The cap matters: a transcript is the one input that could blow the context budget,
 * since a long video is far more text than a blog post.
 */
export function formatTranscript(
    paragraphs: { t: number; text: string }[],
    cap = TRANSCRIPT_CHAR_CAP,
): string {
    const spoken = paragraphs.map((p) => `[${formatTimestamp(p.t)}] ${p.text}`).join('\n');
    return spoken.length > cap ? `${spoken.slice(0, cap)}\n[transcript truncated]` : spoken;
}

export interface Source {
    /** Stable identifier the model cites, e.g. `blog:ecb-part-1`. */
    id: string;
    title: string;
    /** Omitted when the entry has no page of its own. */
    url?: string;
}

export interface Corpus {
    /** The prompt block. Stable for a given language — keep it first in the system
     *  prompt so Gemini's implicit caching can hit on the prefix. */
    text: string;
    /** Everything citable, for resolving ids back into links. */
    sources: Source[];
}

type Json = Record<string, any>;

const cvByLang = import.meta.glob<Json>('../../content/cv/*.json', { eager: true, import: 'default' });
const skillsByLang = import.meta.glob<Json>('../../content/skills/*.json', { eager: true, import: 'default' });
const qaByLang = import.meta.glob<Json>('../../content/qa/*.json', { eager: true, import: 'default' });
const blogFiles = import.meta.glob<Json>('../../content/blog/*.json', { eager: true, import: 'default' });
const portfolioFiles = import.meta.glob<Json>('../../content/portfolio/*.json', { eager: true, import: 'default' });
const videoFiles = import.meta.glob<Json>('../../content/videos/*.json', { eager: true, import: 'default' });

// The material that makes this a personal site rather than a CV. These were invisible
// to the assistant, which is why it could say where Anton studied but not what shaped
// how he thinks. Some are per-language folders, some are single files keyed by language.
const adversityByLang = import.meta.glob<Json>('../../content/adversity/*.json', { eager: true, import: 'default' });
const timelineByLang = import.meta.glob<Json>('../../content/timeline/*.json', { eager: true, import: 'default' });
const resourcesByLang = import.meta.glob<Json>('../../content/resources/*.json', { eager: true, import: 'default' });
const influenceFiles = import.meta.glob<Json>('../../content/influences/*/*.json', { eager: true, import: 'default' });
const legacyFiles = import.meta.glob<Json>('../../content/legacy/*/*.json', { eager: true, import: 'default' });
// books is a flat set; travel and soundtrack are per-language folders like influences
// and legacy. Getting this wrong is silent — a glob that matches nothing yields an
// empty section rather than an error — which is what the prefix test below catches.
const bookFiles = import.meta.glob<Json>('../../content/books/*.json', { eager: true, import: 'default' });
const travelFiles = import.meta.glob<Json>('../../content/travel/*/*.json', { eager: true, import: 'default' });
const soundtrackFiles = import.meta.glob<Json>('../../content/soundtrack/*/*.json', { eager: true, import: 'default' });

/** `../../content/blog/welfare-part-1.json` -> `welfare-part-1` */
function slugOf(path: string): string {
    return path.split('/').pop()!.replace(/\.json$/, '');
}

/** `../../content/influences/en/dostoevsky.json` -> `en` */
function langOf(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 2];
}

/**
 * Which language trees actually have a page for each section.
 *
 * The German tree is a reduced set — it has books, timeline and resources but not
 * influences, legacy, travel, soundtrack or the adversity essay. Citing a `/de/` URL
 * for a page that does not exist would hand a visitor a 404, which is exactly what
 * `resolveSources` dropping unknown ids is meant to prevent. Where German has no page,
 * cite the English one.
 */
const SECTION_ROUTES: Record<string, { path: string; langs: Lang[] }> = {
    influences: { path: 'influences', langs: ['da', 'en'] },
    legacy: { path: 'legacy', langs: ['da', 'en'] },
    books: { path: 'books', langs: ['da', 'en', 'de'] },
    travel: { path: 'travel', langs: ['da', 'en'] },
    timeline: { path: 'timeline', langs: ['da', 'en', 'de'] },
    soundtrack: { path: 'soundtrack', langs: ['da', 'en'] },
    resources: { path: 'resources', langs: ['da', 'en', 'de'] },
    adversity: { path: 'modgang-og-maalrettethed', langs: ['da', 'en'] },
};

function sectionUrl(section: keyof typeof SECTION_ROUTES, lang: Lang): string {
    const route = SECTION_ROUTES[section];
    const served = route.langs.includes(lang) ? lang : 'en';
    return served === 'da' ? `/${route.path}` : `/${served}/${route.path}`;
}

function byLang(map: Record<string, Json>, lang: Lang): Json {
    const hit = Object.entries(map).find(([p]) => slugOf(p) === lang);
    if (hit) return hit[1];
    const fallback = Object.entries(map).find(([p]) => slugOf(p) === 'en');
    return fallback ? fallback[1] : {};
}

/**
 * Blog posts are localised by suffixed fields on one file. Danish has hand-written
 * `_da` copy; German has none, so it reads the English body under a German
 * instruction. That is the honest fallback — better a real answer in the wrong
 * source language than a confident nothing.
 */
function localised<T>(entry: Json, field: string, lang: Lang): T | undefined {
    // Several video entries carry `title_da: ""` as a placeholder for copy nobody has
    // written yet, so "present" has to mean non-empty rather than merely defined —
    // otherwise the corpus lists untitled videos. This matches what the page
    // templates do (`title_da || title`).
    const suffixed = lang === 'en' ? undefined : entry[`${field}_${lang}`];
    return isEmpty(suffixed) ? entry[field] : suffixed;
}

function isEmpty(v: unknown): boolean {
    if (v === undefined || v === null || v === '') return true;
    return Array.isArray(v) && v.length === 0;
}

/** Per-post pages exist for Danish and English only; German readers get the English page. */
function blogUrl(slug: string, lang: Lang): string {
    return lang === 'da' ? `/blog/${slug}` : `/en/blog/${slug}`;
}

function section(heading: string, lines: string[]): string {
    return lines.length ? `\n[${heading}]\n${lines.join('\n')}\n` : '';
}

export function buildCorpus(lang: Lang): Corpus {
    const cv = byLang(cvByLang, lang);
    const skills = byLang(skillsByLang, lang);
    const qa = byLang(qaByLang, lang);
    const sources: Source[] = [];

    // ── Education ───────────────────────────────────────────────────────────────
    const education = (cv.education ?? []).map((e: Json, i: number) => {
        sources.push({ id: `cv:education:${i}`, title: `${e.degree} — ${e.institution}`, url: '/cv' });
        const bullets = (e.bullets ?? []).join('. ');
        return `- (cv:education:${i}) ${e.degree}, ${e.institution} (${e.period}). ${e.description ?? ''} ${bullets}`.trim();
    });

    // ── Work ────────────────────────────────────────────────────────────────────
    const experience = (cv.experience ?? []).map((e: Json, i: number) => {
        sources.push({ id: `cv:experience:${i}`, title: `${e.title} — ${e.organization}`, url: '/cv' });
        return `- (cv:experience:${i}) ${e.title} at ${e.organization}, ${e.location} (${e.period}): ${(e.description ?? []).join('. ')}`;
    });

    // ── Skills ──────────────────────────────────────────────────────────────────
    const skillLines: string[] = [];
    if (skills.programming?.length) {
        skillLines.push(`- Programming: ${skills.programming.map((s: Json) => `${s.name} (${s.level ?? 'n/a'})`).join(', ')}`);
    }
    if (skills.professional?.length) {
        skillLines.push(`- Professional: ${skills.professional.map((s: Json) => s.name).join(', ')}`);
    }
    if (skills.languages?.length) {
        skillLines.push(`- Spoken languages: ${skills.languages.map((l: Json) => `${l.name} (${l.level})`).join(', ')}`);
    }

    // ── Coursework ──────────────────────────────────────────────────────────────
    // Titles, level and grade only. The syllabus and learning-outcome arrays are the
    // bulk of cv.json and add little the model can use in a chat answer.
    const courses = (cv.courses ?? []).map(
        (c: Json) => `- ${c.title} (${c.institution}, ${c.level ?? ''}${c.grade ? `, grade ${c.grade}` : ''})`,
    );

    // ── Projects ────────────────────────────────────────────────────────────────
    const projects = (cv.projects ?? []).map((p: Json, i: number) => {
        const id = `cv:project:${i}`;
        sources.push({ id, title: p.title, url: p.url });
        const tech = (p.technologies ?? []).join(', ');
        return `- (${id}) ${p.title}${tech ? ` [${tech}]` : ''}: ${p.description}`;
    });

    const portfolio = Object.entries(portfolioFiles).map(([path, p]) => {
        const id = `portfolio:${slugOf(path)}`;
        // Only three of the five entries have a route slug; the rest have no page.
        const url = p.slug ? `/projects/${p.slug}` : undefined;
        sources.push({ id, title: p.title, url });
        return `- (${id}) ${p.title} [${p.tools ?? ''}]: ${p.description} Output: ${p.output ?? ''}`;
    });

    // ── Writing ─────────────────────────────────────────────────────────────────
    // Full bodies. This is the part the previous implementation left out entirely.
    const writing = Object.entries(blogFiles)
        .sort(([a], [b]) => slugOf(a).localeCompare(slugOf(b)))
        .map(([path, post]) => {
            const slug = slugOf(path);
            const id = `blog:${slug}`;
            const title = localised<string>(post, 'title', lang) ?? '';
            const description = localised<string>(post, 'description', lang) ?? '';
            const body = (localised<string[]>(post, 'content', lang) ?? []).join('\n');
            const url = blogUrl(slug, lang);
            sources.push({ id, title, url });

            const header = `### (${id}) "${title}" — ${post.category ?? ''} — ${url}`;
            // Five of the sixteen posts are link collections with no body; their
            // description is all there is to say about them.
            return body ? `${header}\n${description}\n${body}` : `${header}\n${description}`;
        });

    // ── Videos ──────────────────────────────────────────────────────────────────
    // Metadata always; spoken content when a transcript exists. resolveTranscript does
    // the language fallback and returns an empty result when there is no file, so this
    // needs no guard of its own — today every video takes the empty path, and dropping
    // a .vtt into src/data/transcripts and naming it in the entry is the whole job.
    const videos = Object.entries(videoFiles).map(([path, v]) => {
        const slug = slugOf(path);
        const id = `video:${slug}`;
        const title = localised<string>(v, 'title', lang) ?? '';
        const url = lang === 'da' ? `/videoer/${slug}` : `/en/videos/${slug}`;
        sources.push({ id, title, url });

        const header = `- (${id}) "${title}" [${v.track}] — ${localised<string>(v, 'description', lang) ?? ''} — ${url}`;

        const transcript = resolveTranscript(v as Parameters<typeof resolveTranscript>[0], lang);
        if (!transcript.hasTranscript) return header;

        return `${header}\n  Transcript:\n${formatTranscript(transcript.paragraphs)}`;
    });

    // ── Q&A ─────────────────────────────────────────────────────────────────────
    const qaLines = (qa.items ?? []).map((i: Json) => `- Q: ${i.question}\n  A: ${i.answer}`);

    // ── Credentials the CV file carries but the corpus used to drop ─────────────
    // buildCorpus read experience, education, projects and courses from cv.json and
    // stopped, so the assistant could not name a certification or an organisation.
    const credentials = [
        ...(cv.certifications ?? []).map(
            (c: Json) => `- Certification: ${c.name} — ${c.description}`,
        ),
        ...(cv.organizations ?? []).map(
            (o: Json) => `- Organisation: ${o.role} at ${o.name} (${o.period}) — ${o.description}`,
        ),
    ];

    // ── Who he is, not just what he has done ────────────────────────────────────
    // A helper for the per-language folder collections (influences, legacy): pick the
    // entries for this language, falling back to English where a translation is absent.
    const inLang = (files: Record<string, Json>) => {
        const wanted = Object.entries(files).filter(([p]) => langOf(p) === lang);
        return wanted.length ? wanted : Object.entries(files).filter(([p]) => langOf(p) === 'en');
    };

    const influences = inLang(influenceFiles).map(([path, i]) => {
        const id = `influence:${slugOf(path)}`;
        sources.push({ id, title: i.name, url: sectionUrl('influences', lang) });
        return `- (${id}) ${i.name} — ${i.role} [${i.category}]. "${i.quote}" Why they matter: ${i.impact}`;
    });

    const legacy = inLang(legacyFiles).map(([path, l]) => {
        const id = `legacy:${slugOf(path)}`;
        sources.push({ id, title: l.title, url: sectionUrl('legacy', lang) });
        const context = l.historicalContext ? ` Historical context: ${l.historicalContext.text}` : '';
        return `- (${id}) ${l.title} — ${l.role} (${l.period ?? ''}). ${l.story} Impact: ${l.impact}.${context}`;
    });

    // A single file per language, structured as chapters. This is the most personal
    // writing on the site, so it goes in whole rather than summarised.
    const adversityDoc = byLang(adversityByLang, lang);
    const adversity = (adversityDoc.chapters ?? []).map((c: Json) => {
        const id = `adversity:${c.id}`;
        sources.push({ id, title: c.title, url: sectionUrl('adversity', lang) });
        const quotes = (c.quotes ?? []).map((q: Json) => `"${q.text}"${q.author ? ` — ${q.author}` : ''}`).join(' ');
        return `### (${id}) ${c.title}\n${(c.content ?? []).join('\n')}${quotes ? `\n${quotes}` : ''}${c.outro ? `\n${c.outro}` : ''}`;
    });

    const books = Object.entries(bookFiles).map(([path, b]) => {
        const id = `book:${slugOf(path)}`;
        sources.push({ id, title: b.title, url: sectionUrl('books', lang) });
        return `- (${id}) "${b.title}" by ${b.author}. ${b.note}`;
    });

    const travel = inLang(travelFiles).map(([path, t]) => {
        const id = `travel:${slugOf(path)}`;
        sources.push({ id, title: `${t.city}, ${t.country}`, url: sectionUrl('travel', lang) });
        return `- (${id}) ${t.city}, ${t.country} [${t.category}]. ${t.description} What it taught him: ${t.lesson}`;
    });

    const soundtrack = inLang(soundtrackFiles).map(([path, s]) => {
        const id = `soundtrack:${slugOf(path)}`;
        sources.push({ id, title: s.title, url: sectionUrl('soundtrack', lang) });
        return `- (${id}) "${s.title}" [${s.vibe}] — ${s.description}`;
    });

    const timelineDoc = byLang(timelineByLang, lang);
    const timeline = (timelineDoc.items ?? []).map((item: Json, i: number) => {
        const id = `timeline:${i}`;
        sources.push({ id, title: `${item.year} — ${item.title}`, url: sectionUrl('timeline', lang) });
        return `- (${id}) ${item.year}: ${item.title}. ${item.description}`;
    });

    const resourcesDoc = byLang(resourcesByLang, lang);
    const resources = (resourcesDoc.items ?? []).map((item: Json, i: number) => {
        const id = `resource:${i}`;
        sources.push({ id, title: item.title, url: sectionUrl('resources', lang) });
        return `- (${id}) ${item.title} — ${item.desc}`;
    });

    const text = [
        'FACTS ABOUT ANTON (SOURCE OF TRUTH)',
        'Everything below is verified. Do not state anything about Anton that is not here.',
        'Parenthesised ids such as (blog:ecb-part-1) identify a source you may cite.',
        section('Education', education),
        section('Work Experience', experience),
        section('Technical Skills', skillLines),
        section('Coursework', courses),
        section('Credentials and Organisations', credentials),
        section('Projects', [...projects, ...portfolio]),
        section('Timeline', timeline),
        section('Videos', videos),
        section('Frequently Asked', qaLines),
        // The personal material. Kept together and after the record, so the assistant
        // reads it as who Anton is rather than as more CV.
        section('Thinkers and Mentors Who Shaped Him', influences),
        section('Family and Inheritance', legacy),
        section('Books That Stayed With Him', books),
        section('Places and What They Taught Him', travel),
        section('Soundtrack', soundtrack),
        section('Resources He Recommends', resources),
        adversity.length
            ? `\n[On Adversity — Anton's own essay, in full]\n${adversity.join('\n\n')}\n`
            : '',
        writing.length ? `\n[Writing — full text of Anton's posts]\n${writing.join('\n\n')}\n` : '',
    ].join('\n');

    return { text, sources };
}

/** Resolve cited ids back into links. Unknown ids are dropped rather than guessed. */
export function resolveSources(ids: string[], lang: Lang): Source[] {
    const { sources } = buildCorpus(lang);
    const index = new Map(sources.map((s) => [s.id, s]));
    return ids.map((id) => index.get(id)).filter((s): s is Source => Boolean(s));
}
