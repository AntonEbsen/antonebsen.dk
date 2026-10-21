import { describe, expect, it } from 'vitest';
import { getAcademicProjects, withAcademicProjects } from './academic-research';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('application-facing research summaries', () => {
  for (const lang of ['da', 'en'] as const) {
    it(`${lang}: distinguishes completed, ongoing and proposed work`, () => {
      const projects = getAcademicProjects(lang);
      expect(projects.map(p => p.kind)).toEqual(['completed', 'ongoing', 'proposal']);
      expect(projects[0].grade).toBe('12');
      expect(projects[2].grade).toBe('10');
      expect(projects[1].credits).toContain('Jonas Skov Nielsen');
      expect(projects[1].credits).toContain('Sheng Ye Michael Chen');
      expect(projects[1].credits).toContain('Paul Sharp');
      expect(JSON.stringify(projects)).not.toMatch(/TBD|zenodo\.xxxx|cost-of-quality|Factory Acts/);
      for (const p of projects) {
        expect(existsSync(resolve(`src/pages${p.url}.astro`))).toBe(true);
        expect(p.limitations.length).toBeGreaterThan(100);
      }
    });
    it(`${lang}: course records agree with the verified summaries`, () => {
      const cv = JSON.parse(readFileSync(resolve(`src/content/cv/${lang}.json`), 'utf8'));
      expect(cv.courses.find((c: { title: string }) => c.title === 'Demography').grade).toBe('12');
      expect(cv.projects[0].title).toBe(getAcademicProjects(lang)[0].title);
      expect(cv.projects.filter((p: { url: string }) => p.url.endsWith('/demography-project'))).toHaveLength(1);
    });
  }
  it('replaces legacy project entries without dropping unrelated coursework', () => {
    const result = withAcademicProjects([
      { title: 'Old placeholder', description: '', url: '/projects/demography-project' },
      { title: 'Other coursework', description: 'Retain this', url: '/projects/other' }
    ], 'en');
    expect(result).toHaveLength(4);
    expect(result.some(p => p.title === 'Old placeholder')).toBe(false);
    expect(result.at(-1)?.description).toBe('Retain this');
  });
  it('does not claim to have collected the proposed AI sample', () => {
    const proposal = getAcademicProjects('en')[2];
    expect(proposal.data).toContain('not an existing dataset');
    expect(proposal.findings).toContain('not a completed empirical study');
    expect(proposal.limitations).toContain('does not solve this selection problem');
    expect(proposal.credits).toContain('main contributor to the empirical strategy');
    expect(proposal.credits).toContain('Jonas Amassa Skov Nielsen');
    expect(proposal.pdfUrl).toBeUndefined();
  });
  it('publishes only the approved demography paper', () => {
    const projects = getAcademicProjects('en');
    expect(projects.filter(p => p.pdfUrl)).toHaveLength(1);
    expect(existsSync(resolve('public' + projects[0].pdfUrl))).toBe(true);
    expect(projects[1].status).toContain('January 2027');
  });
});
