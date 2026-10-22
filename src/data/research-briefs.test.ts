import { describe, expect, it } from 'vitest';
import { researchBrief } from './research-briefs';
import { researchContribution, type ContributionId } from './research-contributions';
describe('concise project reading layer', () => {
  for (const lang of ['en', 'da'] as const) {
    for (const id of ['demography-project', 'master-thesis', 'genai-inequality', 'welfare-state-seminar'] as ContributionId[]) {
      it(`${lang}/${id}: retains question, data, method and bounded status`, () => {
        const brief = researchBrief(id, lang);
        expect(Object.values(brief).every(text => text.length > 30)).toBe(true);
        expect(Object.values(brief).join(' ').split(/\s+/).length).toBeLessThan(115);
        expect(researchContribution(id, lang).summary.length).toBeGreaterThan(40);
      });
    }
    it(`${lang}: never upgrades proposals or unfinished work to findings`, () => {
      expect(researchBrief('genai-inequality', lang).data).toMatch(lang === 'en' ? /no sample/ : /ingen stikprøve/);
      expect(researchBrief('master-thesis', lang).result).toContain('2027');
      expect(researchBrief('welfare-state-seminar', lang).result).toMatch(lang === 'en' ? /does not identify causal/ : /ikke kausale/);
    });
  }
});
