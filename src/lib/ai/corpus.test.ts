import { describe, it, expect } from 'vitest';
import { buildCorpus, resolveSources, formatTranscript, type Lang } from './corpus';

const LANGS: Lang[] = ['en', 'da', 'de'];

describe('buildCorpus — language', () => {
    it('serves each language its own CV, German included', () => {
        // The previous implementation was `lang === 'da' ? cvDa : cvEn`, so German
        // visitors got the English CV even though src/content/cv/de.json exists.
        expect(buildCorpus('en').text).toContain('Student Lecturer');
        expect(buildCorpus('da').text).toContain('Studenterunderviser');
        expect(buildCorpus('de').text).toContain('Studentischer Dozent');
    });

    it('serves Danish blog titles to Danish readers', () => {
        expect(buildCorpus('da').text).toContain('Eurozonens Dilemma');
        expect(buildCorpus('en').text).toContain('The Eurozone Dilemma');
    });
});

describe('buildCorpus — the writing', () => {
    it('includes full post bodies, not just descriptions', () => {
        // This sentence is from the body of welfare-part-1. If only descriptions were
        // being injected — the old behaviour — it would not be here.
        const en = buildCorpus('en').text;
        expect(en).toContain('There is a claim you hear constantly in economic debate');
        expect(en).toContain('Mundell-Fleming Trilemma');
    });

    it('includes Danish bodies for Danish', () => {
        expect(buildCorpus('da').text).toContain('Eurozonen er en monetær union');
    });

    it('falls back to the English body for German, which has no _de copy', () => {
        expect(buildCorpus('de').text).toContain('The Eurozone is a monetary union');
    });

    it('still lists posts that have no body', () => {
        // Five of the sixteen are link collections. They should appear by title so the
        // assistant can point at them, even with nothing to quote.
        expect(buildCorpus('da').text).toContain('blog:academic-01');
    });
});

describe('buildCorpus — sources', () => {
    it('gives every source a non-empty id and title', () => {
        for (const lang of LANGS) {
            for (const s of buildCorpus(lang).sources) {
                expect(s.id, `id in ${lang}`).toBeTruthy();
                expect(s.title, `title for ${s.id} in ${lang}`).toBeTruthy();
            }
        }
    });

    it('has no duplicate ids', () => {
        for (const lang of LANGS) {
            const ids = buildCorpus(lang).sources.map((s) => s.id);
            expect(new Set(ids).size, `duplicates in ${lang}`).toBe(ids.length);
        }
    });

    it('only ever emits site-relative URLs', () => {
        for (const lang of LANGS) {
            for (const s of buildCorpus(lang).sources) {
                if (s.url) expect(s.url, s.id).toMatch(/^\//);
            }
        }
    });

    it('points Danish readers at /blog and everyone else at /en/blog', () => {
        const da = buildCorpus('da').sources.find((s) => s.id === 'blog:ecb-part-1');
        const de = buildCorpus('de').sources.find((s) => s.id === 'blog:ecb-part-1');
        expect(da?.url).toBe('/blog/ecb-part-1');
        // There is no /de/blog/[slug] route, so German must not link into one.
        expect(de?.url).toBe('/en/blog/ecb-part-1');
    });

    it('mentions each source id in the prompt text, so the model can cite it', () => {
        const { text, sources } = buildCorpus('en');
        for (const s of sources) {
            expect(text, `${s.id} missing from prompt`).toContain(s.id);
        }
    });
});

describe('resolveSources', () => {
    it('turns cited ids back into links', () => {
        const [hit] = resolveSources(['blog:welfare-part-1'], 'en');
        expect(hit.url).toBe('/en/blog/welfare-part-1');
        expect(hit.title).toBe('Does Globalization Shrink the Welfare State?');
    });

    it('drops ids it does not recognise rather than inventing a link', () => {
        // The model will occasionally cite something that does not exist. That must
        // produce no link, not a plausible-looking 404.
        expect(resolveSources(['blog:does-not-exist', 'nonsense', ''], 'en')).toEqual([]);
    });

    it('keeps only the known ids from a mixed list', () => {
        const out = resolveSources(['blog:ecb-part-1', 'blog:fabricated'], 'da');
        expect(out).toHaveLength(1);
        expect(out[0].id).toBe('blog:ecb-part-1');
    });
});

describe('buildCorpus — size', () => {
    it('stays well inside a sane prompt budget in every language', () => {
        for (const lang of LANGS) {
            const chars = buildCorpus(lang).text.length;
            // ~4 chars per token. The whole corpus is meant to sit in context on every
            // request; if this ever trips, retrieval is overdue.
            expect(chars, `${lang} corpus`).toBeLessThan(400_000);
            expect(chars, `${lang} corpus looks empty`).toBeGreaterThan(10_000);
        }
    });
});

describe('formatTranscript', () => {
    const cues = [
        { t: 0, text: 'We start in the valley.' },
        { t: 272, text: 'This is the steep section.' },
        { t: 3661, text: 'And here is the summit.' },
    ];

    it('prefixes each paragraph with a readable timestamp', () => {
        const out = formatTranscript(cues);
        expect(out).toContain('[0:00] We start in the valley.');
        expect(out).toContain('[4:32] This is the steep section.');
    });

    it('carries hours when the video is long enough', () => {
        expect(formatTranscript(cues)).toContain('[1:01:01] And here is the summit.');
    });

    it('caps a long transcript and says that it did', () => {
        // A transcript is the one input that could blow the context budget, so the
        // cap has to hold and the truncation has to be visible to the model rather
        // than looking like the video simply ended.
        const long = Array.from({ length: 500 }, (_, i) => ({
            t: i * 10,
            text: 'a fairly long spoken paragraph that goes on for a while',
        }));
        const out = formatTranscript(long, 1000);
        expect(out.length).toBeLessThan(1100);
        expect(out).toContain('[transcript truncated]');
    });

    it('leaves a short transcript untouched', () => {
        const out = formatTranscript(cues, 10_000);
        expect(out).not.toContain('truncated');
    });

    it('handles an empty transcript', () => {
        expect(formatTranscript([])).toBe('');
    });
});

describe('buildCorpus — videos', () => {
    it('lists every video with a resolvable source id', () => {
        const { text, sources } = buildCorpus('da');
        const videoSources = sources.filter((s) => s.id.startsWith('video:'));
        expect(videoSources.length).toBeGreaterThan(0);
        for (const s of videoSources) {
            expect(text).toContain(s.id);
            expect(s.url).toMatch(/^\/(videoer|en\/videos)\//);
        }
    });

    it('omits the transcript block while no video has a transcript file', () => {
        // Documents today's state rather than asserting it forever: no entry sets
        // transcriptFile and src/data/transcripts holds only a README. When a .vtt
        // is added this flips, and the size assertion below is what keeps it honest.
        expect(buildCorpus('en').text).not.toContain('Transcript:');
    });
});

describe('buildCorpus — who he is, not just what he did', () => {
    it('knows the thinkers who shaped him, with what they changed', () => {
        const { text } = buildCorpus('en');
        expect(text).toContain('Fyodor Dostoevsky');
        // The quote and the "why they matter" are the point — a name alone is trivia.
        expect(text).toContain('finding something to live for');
        expect(text).toMatch(/influence:/);
    });

    it('knows the family stories', () => {
        const { text } = buildCorpus('en');
        expect(text).toContain('The Iron Keeper');
        expect(text).toMatch(/legacy:/);
    });

    it('carries the adversity essay in full, chapter by chapter', () => {
        const { text } = buildCorpus('en');
        expect(text).toContain('The Foundation of Doubt');
        expect(text).toMatch(/adversity:/);
        // Chapters, not a summary: the body text has to be there for the assistant to
        // answer from it rather than paraphrasing a title.
        expect(text).toContain("On Adversity");
    });

    it('knows the books, places and soundtrack', () => {
        const { text } = buildCorpus('en');
        for (const kind of ['book:', 'travel:', 'soundtrack:', 'timeline:', 'resource:']) {
            expect(text, kind).toContain(kind);
        }
    });

    it('includes the certifications and organisations the CV file always had', () => {
        // buildCorpus read experience/education/projects/courses from cv.json and
        // stopped, so these two arrays were sitting unused in a file it already parsed.
        const { text } = buildCorpus('en');
        expect(text).toContain('Certification:');
        expect(text).toContain('Organisation:');
    });
});

describe('buildCorpus — section routes per language', () => {
    it('links Danish readers at the Danish routes', () => {
        const inf = buildCorpus('da').sources.find((s) => s.id.startsWith('influence:'));
        expect(inf?.url).toBe('/influences');
    });

    it('sends German readers to the English page where German has none', () => {
        // The German tree has books, timeline and resources but not influences,
        // legacy, travel, soundtrack or the adversity essay. Citing /de/influences
        // would hand a visitor a 404.
        const de = buildCorpus('de');
        expect(de.sources.find((s) => s.id.startsWith('influence:'))?.url).toBe('/en/influences');
        expect(de.sources.find((s) => s.id.startsWith('legacy:'))?.url).toBe('/en/legacy');
        expect(de.sources.find((s) => s.id.startsWith('adversity:'))?.url)
            .toBe('/en/modgang-og-maalrettethed');
    });

    it('uses the German route where German does have the page', () => {
        const de = buildCorpus('de');
        expect(de.sources.find((s) => s.id.startsWith('book:'))?.url).toBe('/de/books');
        expect(de.sources.find((s) => s.id.startsWith('timeline:'))?.url).toBe('/de/timeline');
        expect(de.sources.find((s) => s.id.startsWith('resource:'))?.url).toBe('/de/resources');
    });

    it('resolves a personal source id back to a link like any other citation', () => {
        const [hit] = resolveSources(['influence:dostoevsky'], 'en');
        // Slug may differ; assert the mechanism works for at least one real id.
        const anyInfluence = buildCorpus('en').sources.find((s) => s.id.startsWith('influence:'))!;
        const [resolved] = resolveSources([anyInfluence.id], 'en');
        expect(resolved.url).toBe('/en/influences');
        expect(resolved.title).toBeTruthy();
    });
});
