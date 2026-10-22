import type { ContributionId } from './research-contributions';
type Brief = { question: string; data: string; method: string; result: string };
const en: Record<ContributionId, Brief> = {
  'demography-project': {
    question: 'Did the Kulturkampf change marriage and fertility in more Catholic Prussian counties?',
    data: 'Galloway census and vital-registration data, Prussian counties, 1867–1890.',
    method: 'Continuous-exposure difference-in-differences with county and year fixed effects; timing and regional checks.',
    result: 'No robust marital-fertility response. Other negative associations concentrate in Polish regions; timing and overlapping policies limit a causal interpretation.',
  },
  'master-thesis': {
    question: 'What can historical records reveal about the economics of slavery on St. Croix?',
    data: 'Historical St. Croix records and existing colonial data; transcription, linkage and cleaning are ongoing.',
    method: 'Historical source criticism, empirical design and calibration of a planter model, under development.',
    result: 'Joint MSc thesis in progress, expected January 2027. No final estimates are presented.',
  },
  'genai-inequality': {
    question: 'Does the relationship between GenAI use and performance vary with students’ socioeconomic background?',
    data: 'Proposed survey linked to grades at Danish upper-secondary schools; no sample has been collected.',
    method: 'Proposed causal forests for heterogeneous associations. Voluntary adoption leaves unobserved selection unresolved.',
    result: 'Joint course research proposal, not an estimated empirical study. Grade 10 refers to the course.',
  },
  'welfare-state-seminar': {
    question: 'Is globalization associated with social transfers, and does that relationship change over time?',
    data: 'Panel of 32 OECD countries, 1980–2023; KOF globalization indices and social transfers as a share of GDP.',
    method: 'Panel regressions, regime interactions and rolling ten-year estimates.',
    result: 'No stable relationship across the full period; associations vary over time. The observational design does not identify causal effects.',
  },
};
const da: Record<ContributionId, Brief> = {
  'demography-project': {
    question: 'Ændrede Kulturkampfen ægteskab og fertilitet i mere katolske preussiske amter?',
    data: 'Galloways folketællinger og vitalstatistik for preussiske amter, 1867–1890.',
    method: 'Difference-in-differences med kontinuert eksponering, amts- og årsfaste effekter samt tidsmæssige og regionale kontroller.',
    result: 'Ingen robust ændring i ægteskabelig fertilitet. Andre negative sammenhænge er koncentreret i polske regioner; tidsforløb og overlappende politikker begrænser en kausal fortolkning.',
  },
  'master-thesis': {
    question: 'Hvad kan historiske kilder fortælle om slaveriets økonomi på St. Croix?',
    data: 'Historiske kilder fra St. Croix og eksisterende koloniale data; transskription, sammenkobling og rensning er i gang.',
    method: 'Historisk kildekritik, empirisk design og kalibrering af en plantermodel under udvikling.',
    result: 'Fælles kandidatspeciale i gang, forventet januar 2027. Ingen endelige estimater præsenteres.',
  },
  'genai-inequality': {
    question: 'Varierer sammenhængen mellem GenAI-brug og præstationer med elevernes socioøkonomiske baggrund?',
    data: 'Foreslået spørgeskema koblet til gymnasiekarakterer; ingen stikprøve er indsamlet.',
    method: 'Foreslåede causal forests til heterogene sammenhænge. Frivillig anvendelse efterlader uobserveret selektion.',
    result: 'Fælles kursusforslag, ikke et estimeret empirisk studie. Karakteren 10 gælder kurset.',
  },
  'welfare-state-seminar': {
    question: 'Hænger globalisering sammen med sociale overførsler, og ændrer sammenhængen sig over tid?',
    data: 'Panel med 32 OECD-lande, 1980–2023; KOF-globaliseringsindeks og sociale overførsler som andel af BNP.',
    method: 'Panelregressioner, interaktioner med velfærdsregimer og rullende tiårsestimater.',
    result: 'Ingen stabil sammenhæng over hele perioden; sammenhængene varierer over tid. Designet identificerer ikke kausale effekter.',
  },
};
export function researchBrief(id: ContributionId, lang: 'en' | 'da') { return (lang === 'da' ? da : en)[id]; }
