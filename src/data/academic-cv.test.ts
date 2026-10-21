import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';
import cv from './academic-cv.json';
import { academicNavigation, isAcademicPath } from '../i18n/academic-navigation';
import { buildCorpus, resolveSources } from '../lib/ai/corpus';

describe('academic application profile', () => {
  for (const lang of ['en', 'da'] as const) {
    it(`${lang}: retains actual education, course stages and individual contribution`, () => {
      const value = cv[lang];
      expect(value.profile).toContain(lang === 'en' ? 'January 2027' : 'januar 2027');
      expect(JSON.stringify(value)).not.toMatch(/PhD candidate|doctoral student|expert|DOI|Casper Worm Hansen/);
      expect(value.sections.map(s => s.id)).toEqual(['education', 'projects', 'experience', 'skills', 'service']);
      expect(value.sections[0].items).toHaveLength(2);
      expect(value.sections[0].items[0].meta).toContain('2024');
      expect(value.sections[0].items[1].meta).toContain(lang === 'en' ? 'May 2024' : 'maj 2024');
      expect(value.sections[1].items).toHaveLength(4);
      const thesis = value.sections[1].items[1];
      expect('meta' in thesis ? thesis.meta : '').toContain(lang === 'en' ? 'In progress' : 'I gang');
      expect(value.sections[1].items[2].text).toContain('Jonas Amassa Skov Nielsen');
      expect(value.sections[1].items[2].text).toContain(lang === 'en' ? 'Main contributor' : 'Hovedbidragyder');
      expect(value.sections[1].items[2].text).toContain(lang === 'en' ? 'no collected sample' : 'ingen indsamlet stikprøve');
    });
  }
  it('provides a real, searchable, single-page PDF matching the web content', async () => {
    const parser = new PDFParse({ data: new Uint8Array(readFileSync(`public${cv.pdfPath}`)) });
    try {
      const result = await parser.getText();
      expect(result.total).toBe(1);
      expect(result.text).toContain(cv.name);
      expect(result.text).toContain('January 2027');
      expect(result.text).toContain('Awarded May 2024');
      expect(result.text).toContain('September 2024-present');
      for (const section of cv.en.sections) {
        expect(result.text).toContain(section.title);
        for (const item of section.items) {
          expect(result.text).toContain(item.title.replaceAll('’', "'"));
          const normalise = (value: string) => value.replaceAll('’', "'").replace(/\s+/g, ' ').trim();
          expect(normalise(result.text)).toContain(normalise(item.text));
        }
      }
      expect(result.text).not.toMatch(/PhD Candidate|References|Personality|certification/i);
    } finally { await parser.destroy(); }
  });
  it('uses compact navigation only on academic routes, preserving other areas', () => {
    for (const path of ['/', '/en', '/en/', '/cv', '/en/cv/', '/about', '/en/cliometrics', '/projects/demography-project']) expect(isAcademicPath(path)).toBe(true);
    for (const path of ['/de', '/de/cv', '/en/blog', '/en/cv/full', '/en/about-other']) expect(isAcademicPath(path)).toBe(false);
    expect(academicNavigation('en').slice(0, 5).map(item => item.label)).toEqual(['Home', 'Research', 'CV', 'About', 'Contact']);
    expect(academicNavigation('da').at(-1)?.children?.some(item => item.url === '/cv/full')).toBe(true);
  });
  it('grounds the assistant in the current CV without inferred qualifications', () => {
    const corpus = buildCorpus('en');
    expect(corpus.text).toContain('not a PhD candidate or doctoral student');
    expect(corpus.text).toContain('Main contributor to the empirical strategy');
    expect(corpus.text).not.toContain('Python (expert)');
    expect(resolveSources(['academic:profile'], 'en')[0].url).toBe('/en/cv');
  });
});
