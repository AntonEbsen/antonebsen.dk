import { describe, expect, it } from 'vitest';
import cv from './academic-cv.json';
import { researchContribution, type ContributionId } from './research-contributions';
import { SOURCE_TO_DATA } from './source-to-data';
import { DEMOGRAPHY_VALIDATION } from './demography-validation';
import { jonas } from './collaborators';

describe('evidence-backed individual research contributions', () => {
  const ids: ContributionId[] = ['demography-project', 'master-thesis', 'genai-inequality', 'welfare-state-seminar'];
  for (const lang of ['en', 'da'] as const) {
    for (const id of ids) {
      it(`${lang}/${id}: provides a bounded role rather than a sole-authorship claim for joint work`, () => {
        const role = researchContribution(id, lang);
        expect(role.summary.length).toBeGreaterThan(60);
        expect(role.tasks.length).toBeGreaterThanOrEqual(2);
        if (id !== 'demography-project') {
          expect(role.attribution).toContain('Jonas');
          expect(role.attribution).toContain('Sheng Ye Michael Chen');
          expect(role.attribution).toMatch(lang === 'en' ? /Joint/ : /Fælles/);
        } else {
          expect(role.attribution).toContain('Galloway');
          expect(role.summary).toMatch(lang === 'en' ? /already-digitized/ : /allerede digitaliserede/);
        }
      });
    }
    it(`${lang}: CV and project agree on confirmed thesis and welfare-paper responsibilities`, () => {
      const thesis = researchContribution('master-thesis', lang);
      expect(thesis.summary).toMatch(lang === 'en' ? /planter model/ : /plantermodellen/);
      expect(thesis.attribution).toContain('Paul Sharp');
      const projects = cv[lang].sections.find(section => section.id === 'projects')!.items;
      expect(projects[1].text).toMatch(lang === 'en' ? /planter-model calibration/ : /kalibrering af plantermodellen/);
      expect(projects[3].text).toMatch(lang === 'en' ? /econometric analysis and code/ : /økonometrisk analyse og kode/);
      expect(researchContribution('welfare-state-seminar', lang).summary).toMatch(lang === 'en' ? /econometric analysis and code/ : /økonometriske analyse og koden/);
    });
  }
});

describe('actual source-to-data example, not synthetic archival evidence', () => {
  it('uses the author-confirmed collaborator spelling', () => {
    expect(jonas.name).toBe('Jonas Amassa Skov Nielsen');
  });
  it('is derived from the unchanged audited record and preserves the actual year', () => {
    expect(DEMOGRAPHY_VALIDATION.report.sample_diagnostics.excluded_out_of_window_records).toContainEqual(SOURCE_TO_DATA.source);
    expect(SOURCE_TO_DATA.source).toEqual({ Code: 545, Year: 1866, _source_file: 'VIT1867.XLS' });
    expect(SOURCE_TO_DATA.record).toEqual({ county_code: 545, year: 1866,
      source_file: 'VIT1867.XLS', in_study_window: false, decision: 'exclude' });
    expect(SOURCE_TO_DATA.start).toBe(1867);
    expect(SOURCE_TO_DATA.end).toBe(1890);
    expect(SOURCE_TO_DATA.reportUrl).toContain(DEMOGRAPHY_VALIDATION.commit);
  });
});
