/** Roles confirmed by Anton; the individual demography tasks are documented in
 * the submitted paper. Do not infer how the other coauthors divided their work. */
export type ContributionId = 'demography-project' | 'master-thesis' | 'genai-inequality' | 'welfare-state-seminar';
export type ContributionLanguage = 'en' | 'da';
interface Contribution { summary: string; tasks: string[]; attribution: string }
const english: Record<ContributionId, Contribution> = {
  'demography-project': {
    summary: 'This is my individual demography course paper. I worked with already-digitized historical data rather than transcribing new archival records.',
    tasks: [
      'Data: construct the county-year sample from Galloway census and vital-registration data, match counties across sources, and define the 1871 Catholic-share measure and demographic denominators.',
      'Empirical decisions: use continuous-exposure difference-in-differences, county and year fixed effects, and timing and regional comparisons.',
      'Identification: examine parallel trends and the overlap between Catholic affiliation, Polish ethnicity and concurrent policies; qualify the causal interpretation accordingly.',
    ],
    attribution: 'Sole-authored course paper; the historical database was assembled by Patrick R. Galloway. The later, AI-assisted reproducibility check shown below is separate from the submitted May 2026 paper.',
  },
  'master-thesis': {
    summary: 'In this joint thesis, I am responsible for data transcription, linkage and cleaning. I am the main contributor to the empirical design and calibration of the planter model.',
    tasks: [
      'Historical data: lead the transcription workflow and the linkage and cleaning of the resulting records.',
      'Research design: make the main contribution to the empirical design and planter-model calibration; these remain work in progress.',
    ],
    attribution: 'Joint work with Jonas Skov Nielsen and Sheng Ye Michael Chen, supervised by Paul Sharp. These are my responsibilities within the collaboration, not a claim of sole authorship or completed results.',
  },
  'genai-inequality': {
    summary: 'I was the main contributor to the empirical strategy in this group research proposal.',
    tasks: [
      'Empirical design: develop the proposed strategy for examining heterogeneous relationships between GenAI use and student performance.',
      'Identification: address voluntary adoption and unobserved selection; a proposed causal forest does not by itself establish causal effects.',
    ],
    attribution: 'Joint proposal with Jonas Amassa Skov Nielsen and Sheng Ye Michael Chen. This was a research design, not a collected dataset or completed empirical study; the grade of 10 is the course grade.',
  },
  'welfare-state-seminar': {
    summary: 'I was responsible for the econometric analysis and code, and wrote the chapters documenting that analysis.',
    tasks: [
      'Analysis and implementation: take responsibility for the econometric work and its code.',
      'Writing: write the chapters documenting the econometric analysis.',
    ],
    attribution: 'Joint seminar paper with Jonas Skov Nielsen and Sheng Ye Michael Chen. The paper and its conclusions are joint work; the reported estimates are associations, not identified causal effects.',
  },
};
const danish: Record<ContributionId, Contribution> = {
  'demography-project': {
    summary: 'Dette er min individuelle demografiopgave. Jeg arbejdede med allerede digitaliserede historiske data frem for at transskribere nye arkivkilder.',
    tasks: [
      'Data: konstruere amt-år-stikprøven fra Galloways folketællinger og vitalstatistik, matche amter på tværs af kilder og definere den katolske andel i 1871 og de demografiske nævnere.',
      'Empiriske valg: anvende difference-in-differences med kontinuert eksponering, amts- og årsfaste effekter samt tidsmæssige og regionale sammenligninger.',
      'Identifikation: undersøge parallelle trends og overlappet mellem katolicisme, polsk etnicitet og samtidige politikker og begrænse den kausale fortolkning derefter.',
    ],
    attribution: 'Individuel kursusopgave; den historiske database er samlet af Patrick R. Galloway. Den senere, AI-assisterede reproducerbarhedskontrol nedenfor er adskilt fra opgaven afleveret i maj 2026.',
  },
  'master-thesis': {
    summary: 'I det fælles speciale har jeg ansvaret for datatransskription, sammenkobling og rensning. Jeg er hovedbidragyder til det empiriske design og kalibreringen af plantermodellen.',
    tasks: [
      'Historiske data: stå for transskriptionsarbejdet og sammenkobling og rensning af de resulterende data.',
      'Forskningsdesign: levere hovedbidraget til det empiriske design og kalibreringen af plantermodellen; arbejdet er fortsat i gang.',
    ],
    attribution: 'Fælles arbejde med Jonas Skov Nielsen og Sheng Ye Michael Chen med Paul Sharp som vejleder. Dette er mine ansvarsområder i samarbejdet, ikke et udsagn om eneforfatterskab eller færdige resultater.',
  },
  'genai-inequality': {
    summary: 'Jeg var hovedbidragyder til den empiriske strategi i dette forskningsforslag i gruppe.',
    tasks: [
      'Empirisk design: udvikle den foreslåede strategi til at undersøge heterogene sammenhænge mellem GenAI-brug og elevers faglige præstationer.',
      'Identifikation: forholde mig til frivillig anvendelse og uobserveret selektion; en foreslået causal forest identificerer ikke i sig selv kausale effekter.',
    ],
    attribution: 'Fælles forslag med Jonas Amassa Skov Nielsen og Sheng Ye Michael Chen. Det var et forskningsdesign, ikke et indsamlet datasæt eller et afsluttet empirisk studie; karakteren 10 er kursuskarakteren.',
  },
  'welfare-state-seminar': {
    summary: 'Jeg havde ansvaret for den økonometriske analyse og koden og skrev kapitlerne, der dokumenterer denne analyse.',
    tasks: [
      'Analyse og implementering: have ansvaret for det økonometriske arbejde og den tilhørende kode.',
      'Skriftligt arbejde: skrive kapitlerne, der dokumenterer den økonometriske analyse.',
    ],
    attribution: 'Fælles seminaropgave med Jonas Skov Nielsen og Sheng Ye Michael Chen. Opgaven og konklusionerne er fælles arbejde; estimaterne beskriver sammenhænge, ikke identificerede kausale effekter.',
  },
};
export function researchContribution(id: ContributionId, lang: ContributionLanguage): Contribution {
  return (lang === 'da' ? danish : english)[id];
}
