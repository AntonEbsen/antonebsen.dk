import { languageOrigin, publicLanguageUrl } from '../i18n/domains';
import type { ResearchLanguage } from './academic-research';

/** Verified against the submitted PDF, not its later filesystem creation date.
 * This is a course paper, not a journal article or a numbered working paper. */
export const DEMOGRAPHY_PAPER = {
  title: 'Bismarck’s Lost Battle: Marriage, Fertility, and the Kulturkampf in Prussia, 1867–1890',
  author: 'Anton Meier Ebsen Jørgensen',
  citationAuthor: 'Jørgensen, Anton Meier Ebsen',
  versionDate: '2026-05-29',
  citationDate: '2026/05/29',
  language: 'en',
  institution: 'University of Copenhagen',
  sourcePdf: '/assets/docs/Ebsen_Jorgensen_2026_Bismarcks_Lost_Battle.pdf',
} as const;

export function demographyPaper(lang: ResearchLanguage) {
  const isDa = lang === 'da';
  const pagePath = `${isDa ? '' : '/en'}/projects/demography-project`;
  const pageUrl = publicLanguageUrl(pagePath, isDa ? 'da' : 'en');
  return {
    ...DEMOGRAPHY_PAPER,
    pagePath,
    pageUrl,
    // Same origin and directory as the landing page, as Scholar recommends.
    // Both aliases serve the unchanged approved PDF; the old asset URL stays valid.
    pdfPath: `${pagePath}.pdf`,
    pdfUrl: `${pageUrl}.pdf`,
    bibPath: `${pagePath}.bib`,
    status: isDa ? 'Upubliceret kursusopgave · ikke fagfællebedømt' : 'Unpublished course paper · not peer reviewed',
    dateLabel: isDa ? 'Afleveret 29. maj 2026' : 'Submitted 29 May 2026',
    summary: isDa
      ? 'Ændrede Bismarcks Kulturkampf ægteskab og fertilitet i det nittende århundredes Preussen? Denne kursusopgave kombinerer årlig vitalstatistik på amtsniveau med oplysninger om religiøs sammensætning og polsk politisk opbakning for perioden 1867–1890. Et difference-in-differences-design med kontinuert eksponering sammenligner udviklingen efter 1873 på tværs af amter med forskellig katolsk befolkningsandel i 1871 og anvender amts- og årsfaste effekter samt standardfejl klynget på amtsniveau. Analysen finder ingen robust ændring i den ægteskabelige fertilitet. Negative sammenhænge for fødsels- og ægteskabsrater er koncentreret i polske regioner. Tidsforløbet, overlappet mellem religion og etnicitet og problemer med parallelle trends begrænser en kausal fortolkning. Opgaven illustrerer betydningen af samtidige politikker og historiske målevalg for empirisk analyse.'
      : 'Did Bismarck’s Kulturkampf change marriage and fertility in nineteenth-century Prussia? This course paper combines annual county-level vital registration with information on religious composition and Polish political support for 1867–1890. A continuous-exposure difference-in-differences design compares post-1873 outcomes across counties with different Catholic population shares in 1871, using county and year fixed effects and county-clustered standard errors. The analysis finds no robust response in marital fertility. Negative associations for birth and marriage rates are concentrated in Polish regions. Their timing, the overlap between religion and ethnicity, and problems with parallel trends limit a causal interpretation. The paper illustrates why concurrent policies and historical measurement choices matter for empirical analysis.',
    summaryNote: isDa
      ? 'Kort webresumé af den afleverede opgave. Det oprindelige abstract og den fulde analyse findes i PDF’en.'
      : 'Concise web summary of the submitted paper. The original abstract and full analysis are in the PDF.',
    codeNote: isDa
      ? 'Figur 4.1, relaterede stikprøveantal og tabel 6.1 er kontrolleret særskilt; se kontrollerne og tekstafvigelsen nedenfor. Repositoriet indeholder også senere eksplorative analyser og er ikke en fuldt valideret replikationspakke til den afleverede opgave.'
      : 'Figure 4.1, related sample counts and Table 6.1 have been checked separately; see the checks and prose discrepancy below. The repository also contains later exploratory analyses and is not a fully validated replication package for the submitted paper.',
    citation: `Jørgensen, Anton Meier Ebsen (2026). ${DEMOGRAPHY_PAPER.title}. Unpublished demography course paper, University of Copenhagen. Submitted 29 May 2026.`,
    versionNote: isDa
      ? 'PDF’en er den afleverede version fra 29. maj 2026, ikke en senere revideret working paper. Der er ikke angivet en DOI, tidsskriftstitel eller et serienummer.'
      : 'The PDF is the version submitted on 29 May 2026, not a later revised working paper. No DOI, journal title or working-paper series number is claimed.',
  };
}

export function demographyScholarTags(lang: ResearchLanguage) {
  const paper = demographyPaper(lang);
  return [
    { name: 'citation_title', content: paper.title },
    { name: 'citation_author', content: paper.citationAuthor },
    { name: 'citation_publication_date', content: paper.citationDate },
    { name: 'citation_pdf_url', content: paper.pdfUrl },
    { name: 'citation_abstract_html_url', content: paper.pageUrl },
    // Describes the English paper, even on the Danish summary page.
    { name: 'citation_language', content: paper.language },
  ];
}

export function demographyBibtex() {
  return [
    '@unpublished{Jorgensen2026Bismarck,',
    '  author = {J{\\o}rgensen, Anton Meier Ebsen},',
    "  title = {{Bismarck's Lost Battle: Marriage, Fertility, and the Kulturkampf in Prussia, 1867--1890}},",
    '  year = {2026},',
    '  month = may,',
    '  note = {Unpublished demography course paper, University of Copenhagen. Submitted 29 May 2026. Not peer reviewed.},',
    `  url = {${languageOrigin.en}/en/projects/demography-project}`,
    '}',
    '',
  ].join('\n');
}
