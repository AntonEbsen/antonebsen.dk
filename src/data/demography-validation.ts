import report from '../../public/assets/research/demography/figure-4-1-validation.json';

// Frozen results from the merged validation change, not a live CI status badge.
// The submitted PDF and the later exploratory analysis remain separate versions.
export const DEMOGRAPHY_VALIDATION = {
  date: '2026-10-22',
  commit: '2222e9732dd93f14495b3f68fd6d621dfd559c32',
  figurePath: '/assets/research/demography/figure-4-1.png',
  resultsPath: '/assets/research/demography/figure-4-1-validation.json',
  report,
} as const;

export function demographyValidation(lang: 'da' | 'en') {
  const isDa = lang === 'da';
  const metrics = report.metrics;
  const base = `https://github.com/AntonEbsen/Demography/blob/${DEMOGRAPHY_VALIDATION.commit}/exam_project2`;
  const percent = (value: number) => new Intl.NumberFormat(isDa ? 'da-DK' : 'en-GB', {
    maximumFractionDigits: 2, minimumFractionDigits: 2,
  }).format(value) + '%';
  return {
    ...DEMOGRAPHY_VALIDATION,
    reportUrl: `${base}/reports/figure_4_1_validation.md`,
    codeUrl: `${base}/src/validation/figure_4_1.py`,
    dateLabel: isDa ? '22. oktober 2026' : '22 October 2026',
    heading: isDa ? 'Reproducerbarhed: figur 4.1' : 'Reproducibility check: Figure 4.1',
    intro: isDa
      ? 'Fordelingen af amternes katolske befolkningsandele er rekonstrueret fra de oprindelige Galloway-regneark. Antal amter, opdelingen ved 50% og gennemsnit og median ved opgavens afrunding stemmer med den afleverede figur og tekst.'
      : 'The distribution of counties’ Catholic population shares was reconstructed from the original Galloway workbooks. County counts, the split at 50%, and the mean and median at the paper’s reported precision match the submitted figure and text.',
    rows: [
      [isDa ? 'Amter i figuren' : 'Counties in the figure', String(metrics.counties)],
      [isDa ? 'Katolsk andel ≤50%' : 'Catholic share ≤50%', String(metrics.low_catholic_le_50)],
      [isDa ? 'Katolsk andel >50%' : 'Catholic share >50%', String(metrics.high_catholic_gt_50)],
      [isDa ? 'Gennemsnitlig katolsk andel' : 'Mean Catholic share', percent(metrics.unweighted_mean_percent)],
      [isDa ? 'Median katolsk andel' : 'Median Catholic share', percent(metrics.unweighted_median_percent)],
    ],
    discrepancy: isDa
      ? `Kontrollen fandt også en afvigelse i teksten: ${metrics.counties_between_20_and_80_inclusive} af ${metrics.counties} amter (${percent(metrics.percent_counties_between_20_and_80_inclusive)}) ligger mellem 20% og 80% katolsk befolkning, mod tekstens cirka ${report.known_prose_discrepancy.manuscript_approximate_percent}%. Den oprindelige, afleverede PDF er uændret.`
      : `The check also found a prose discrepancy: ${metrics.counties_between_20_and_80_inclusive} of ${metrics.counties} counties (${percent(metrics.percent_counties_between_20_and_80_inclusive)}) fall between 20% and 80% Catholic, compared with approximately ${report.known_prose_discrepancy.manuscript_approximate_percent}% in the text. The original submitted PDF is unchanged.`,
    scope: isDa
      ? 'Dette er en afgrænset kontrol af én beskrivende figur og relaterede stikprøveantal. Den validerer ikke regressionsresultater, kausal identifikation eller hele repositoriet.'
      : 'This is a limited check of one descriptive figure and related sample counts. It does not validate regression results, causal identification, or the entire repository.',
  };
}
