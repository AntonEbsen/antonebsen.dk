import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DEMOGRAPHY_VALIDATION, demographyValidation } from './demography-validation';

describe('frozen source-level demography validation', () => {
  it('retains the reference version, matching checks, and discrepancy', () => {
    const { report } = DEMOGRAPHY_VALIDATION;
    expect(report.reference_pdf_sha256).toBe('086a7d333c7a9b85f6476e90de30f4f3cfd76d1720996ca0aebfb532803d5e41');
    expect(report.actual_year_window).toEqual([1867, 1890]);
    expect(Object.values(report.matched_manuscript_checks)).toHaveLength(7);
    expect(Object.values(report.matched_manuscript_checks).every(Boolean)).toBe(true);
    expect(report.metrics.counties).toBe(392);
    expect(report.metrics.low_catholic_le_50 + report.metrics.high_catholic_gt_50).toBe(392);
    expect(report.metrics.histogram_counts.reduce((sum, count) => sum + count, 0)).toBe(392);
    expect(report.metrics.counties_between_20_and_80_inclusive).toBe(92);
    expect(report.metrics.percent_counties_between_20_and_80_inclusive).toBeCloseTo(100 * 92 / 392, 12);
    expect(report.known_prose_discrepancy.manuscript_approximate_percent).toBe(22);
    expect(report.status).toBe('figure_reproduced_with_prose_discrepancy');
  });

  it('serves the same recorded results and a real, dimensioned PNG', () => {
    expect(JSON.parse(readFileSync('public' + DEMOGRAPHY_VALIDATION.resultsPath, 'utf8')))
      .toEqual(DEMOGRAPHY_VALIDATION.report);
    const image = readFileSync('public' + DEMOGRAPHY_VALIDATION.figurePath);
    expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([1423, 919]);
  });

  for (const lang of ['en', 'da'] as const) {
    it(`${lang}: formats actual metrics and preserves limitations with pinned source links`, () => {
      const validation = demographyValidation(lang);
      expect(validation.rows[0][1]).toBe('392');
      expect(validation.rows[1][1]).toBe('262');
      expect(validation.rows[2][1]).toBe('130');
      expect(validation.discrepancy).toContain(lang === 'en' ? '23.47%' : '23,47%');
      expect(validation.discrepancy).toContain('22%');
      expect(validation.scope).toMatch(lang === 'en' ? /does not validate regression/ : /validerer ikke regressionsresultater/);
      expect(validation.reportUrl).toContain(`/blob/${DEMOGRAPHY_VALIDATION.commit}/`);
      expect(validation.codeUrl).toContain(`/blob/${DEMOGRAPHY_VALIDATION.commit}/`);
      expect(validation.reportUrl).not.toContain('/main/');
    });
  }
});
