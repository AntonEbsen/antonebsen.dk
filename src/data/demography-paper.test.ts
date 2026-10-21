import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DEMOGRAPHY_PAPER, demographyPaper, demographyScholarTags, demographyBibtex } from './demography-paper';
import { demographyPdfResponse, demographyBibtexResponse } from '../lib/demography-downloads';

describe('verified demography-paper record', () => {
  it('uses the author and submission date from the cover, not the PDF creation date', () => {
    expect(DEMOGRAPHY_PAPER.author).toBe('Anton Meier Ebsen Jørgensen');
    expect(DEMOGRAPHY_PAPER.citationAuthor).toBe('Jørgensen, Anton Meier Ebsen');
    expect(DEMOGRAPHY_PAPER.citationDate).toBe('2026/05/29');
    expect(DEMOGRAPHY_PAPER.title).toBe('Bismarck’s Lost Battle: Marriage, Fertility, and the Kulturkampf in Prussia, 1867–1890');
  });

  for (const lang of ['da', 'en'] as const) {
    it(`${lang}: links the landing page and English PDF on the same host and directory`, () => {
      const paper = demographyPaper(lang);
      const tags = demographyScholarTags(lang);
      const page = new URL(paper.pageUrl);
      const pdf = new URL(paper.pdfUrl);
      expect(page.origin).toBe(lang === 'en' ? 'https://www.antonebsen.com' : 'https://antonebsen.dk');
      expect(pdf.origin).toBe(page.origin);
      expect(dirname(pdf.pathname)).toBe(dirname(page.pathname));
      expect(tags.find(tag => tag.name === 'citation_language')?.content).toBe('en');
      expect(tags.filter(tag => tag.name === 'citation_author')).toHaveLength(1);
      expect(JSON.stringify(tags)).not.toMatch(/Casper|journal_title|conference_title|report_number|doi|issn/);
      expect(paper.summary.length).toBeGreaterThan(600);
      expect(paper.summary).not.toMatch(/\b(?:392|372|393)\b/);
      expect(paper.versionNote).toContain('29');
    });
  }

  it('provides honest, portable BibTeX without an invented publication venue', () => {
    const bib = demographyBibtex();
    expect(bib).toContain('@unpublished{Jorgensen2026Bismarck,');
    expect(bib).toContain('J{\\o}rgensen, Anton Meier Ebsen');
    expect(bib).toContain('Submitted 29 May 2026. Not peer reviewed.');
    expect(bib).toContain('https://www.antonebsen.com/en/projects/demography-project');
    expect(bib).not.toMatch(/\b(?:journal|doi|volume|number)\s*=/i);
    expect(bib).toMatch(/^[\x00-\x7f]*$/);
  });

  it('serves the unchanged approved PDF, still within Scholar’s size limit', async () => {
    const response = demographyPdfResponse();
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(response.headers.get('content-type')).toBe('application/pdf');
    // Compare digests rather than recursively diffing millions of buffer entries.
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      createHash('sha256').update(readFileSync('public' + DEMOGRAPHY_PAPER.sourcePdf)).digest('hex'));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe('086a7d333c7a9b85f6476e90de30f4f3cfd76d1720996ca0aebfb532803d5e41');
    expect(bytes.length).toBeLessThan(5_000_000);
  });

  it('serves a downloadable citation generated from the same record', async () => {
    const response = demographyBibtexResponse();
    expect(response.headers.get('content-type')).toContain('application/x-bibtex');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(await response.text()).toBe(demographyBibtex());
  });
});
