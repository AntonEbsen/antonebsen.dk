/** Summaries checked against Anton's supplied papers. Grades supplied by Anton.
 * Stages, attribution and data availability must remain explicit. */
export type ResearchLanguage = 'da' | 'en' | 'de';
export type ResearchId = 'demography-project' | 'master-thesis' | 'genai-inequality';
export interface AcademicProject {
  id: ResearchId; title: string; subtitle: string; status: string;
  kind: 'completed' | 'ongoing' | 'proposal'; meta: string; description: string;
  technologies: string[]; credits: string; question: string; data: string;
  method: string; findings: string; limitations: string; grade?: string; url: string;
  pdfUrl?: string; codeUrl?: string;
}
const english: Omit<AcademicProject, 'url'>[] = [
  {
    id: 'demography-project', title: 'Bismarck’s Lost Battle',
    subtitle: 'Marriage, Fertility, and the Kulturkampf in Prussia, 1867–1890',
    status: 'Completed course paper · May 2026', kind: 'completed', grade: '12',
    pdfUrl: '/assets/docs/Ebsen_Jorgensen_2026_Bismarcks_Lost_Battle.pdf',
    codeUrl: 'https://github.com/AntonEbsen/Demography',
    meta: 'Demography · University of Copenhagen · Grade: 12',
    description: 'An individual empirical paper using Prussian county data to examine religious repression, marriage and fertility. The analysis distinguishes religious exposure from overlapping ethnic policies and finds no robust marital-fertility response.',
    technologies: ['Historical demography', 'Panel data', 'Difference-in-differences'],
    credits: 'Anton Meier Ebsen Jørgensen. Demography course paper, University of Copenhagen. Lecturer: Casper Worm Hansen. Submitted 29 May 2026.',
    question: 'Did the Kulturkampf change marriage and fertility in more Catholic Prussian counties, and can the religious-policy association be separated from policies targeting ethnic Poles?',
    data: 'County-level vital registration and census information from the Galloway Prussia Database. The main analysis covers 1867–1890, combining fertility and marriage rates with the 1871 Catholic population share and a measure of Polish political support. Population denominators and the construction of marital-fertility rates require particular care.',
    method: 'Continuous-exposure difference-in-differences interacts the pre-policy Catholic share with the post-1873 period, using county and year fixed effects and county-clustered standard errors. Timing and regional comparisons, event-study diagnostics and an ethnicity interaction probe alternative explanations.',
    findings: 'The paper finds no robust response in marital fertility. Negative associations for crude birth and marriage rates are concentrated in Polish regions, and their timing makes a distinct Kulturkampf interpretation difficult. These are qualified empirical findings, not a clean causal estimate of religious repression.',
    limitations: 'Catholic affiliation and Polish ethnicity overlap strongly in some regions. Concurrent Germanization policies, differential fertility trends and measurement choices complicate identification. A null estimate does not establish that religion had no demographic influence.'
  },
  {
    id: 'master-thesis', title: 'The Danish West Indies', subtitle: 'Economic history of slavery on St. Croix',
    status: 'Joint MSc thesis · In progress · Expected January 2027', kind: 'ongoing',
    meta: 'MSc Economics · University of Copenhagen · Supervisor: Paul Sharp',
    description: 'An ongoing joint thesis on the economic history of slavery in the Danish West Indies, combining historical records, archival data construction and quantitative analysis. The draft is not a completed or published paper.',
    technologies: ['Economic history', 'Historical data', 'Handwriting recognition'],
    credits: 'Joint thesis by Jonas Skov Nielsen, Sheng Ye Michael Chen and Anton Meier Ebsen Jørgensen. University of Copenhagen. Supervisor: Paul Sharp. Working title; research in progress.',
    question: 'How can historical records help us understand the economics of slavery on St. Croix in the Danish West Indies?',
    data: 'The draft draws on historical material on St. Croix and existing colonial data. The workflow includes transcribing handwritten Danish sources with Transkribus and checking machine-generated text before turning records into structured research data.',
    method: 'Historical source criticism, data construction and quantitative economic-history analysis. Handwriting recognition supports transcription; it does not replace validation of names, units, coverage or the meaning of the original records. The empirical specification remains work in progress.',
    findings: 'The thesis is ongoing. No final estimates or conclusions are presented here, and the unfinished draft is not offered as a downloadable publication.',
    limitations: 'Archival coverage, transcription errors and changes in historical definitions can affect the resulting dataset. The final research question, sample and empirical claims will be documented with the completed thesis.'
  },
  {
    id: 'genai-inequality', title: 'Does GenAI Help Those Who Need It Most?',
    subtitle: 'A proposed study of generative AI and educational inequality',
    status: 'Group course research proposal · January 2026', kind: 'proposal', grade: '10',
    meta: 'AI for Humanity · University of Copenhagen · Course grade: 10',
    description: 'A group research proposal on socioeconomic differences in the relationship between GenAI use and student performance. It proposes causal forests and discusses why voluntary adoption limits causal interpretation. No data collection or empirical results are claimed.',
    technologies: ['Research design', 'Causal forests (proposed)', 'AI and inequality'],
    credits: 'Group research proposal by Jonas Amassa Skov Nielsen, Sheng Ye Michael Chen and Anton Meier Ebsen Jørgensen for AI for Humanity: Machine Decisions, Learning and Societal Consequences, University of Copenhagen, January 2026. Anton was the main contributor to the empirical strategy. The grade refers to the course, not a published study.',
    question: 'Does the relationship between GenAI use and academic performance differ across students’ socioeconomic backgrounds?',
    data: 'The proposal envisages a survey linked to school grade records for approximately 600–800 students at 3–6 Danish upper-secondary schools. These are proposed sample sizes, not an existing dataset. Access, school agreements and appropriate handling of student data would have to be arranged.',
    method: 'The proposed analysis uses causal forests to explore heterogeneity in grade changes associated with high- versus low-intensity GenAI use, conditional on observed student characteristics. The design is observational: use is voluntary and self-reported, not randomly assigned.',
    findings: 'This is a research design, not a completed empirical study. It contains no collected sample, fitted forest, estimated treatment effects or established policy conclusions.',
    limitations: 'Unobserved motivation, teaching practices and school policies may influence both AI adoption and grades. A causal-forest estimator does not solve this selection problem. Without a credible identification assumption, estimates would describe conditional associations rather than identified causal effects.'
  }
];
const danish: Omit<AcademicProject, 'url'>[] = [
  {
    id: 'demography-project', title: 'Bismarck’s Lost Battle',
    subtitle: 'Marriage, Fertility, and the Kulturkampf in Prussia, 1867–1890',
    status: 'Afsluttet kursusopgave · maj 2026', kind: 'completed', grade: '12',
    pdfUrl: '/assets/docs/Ebsen_Jorgensen_2026_Bismarcks_Lost_Battle.pdf',
    codeUrl: 'https://github.com/AntonEbsen/Demography',
    meta: 'Demografi · Københavns Universitet · Karakter: 12',
    description: 'En individuel empirisk opgave om religiøs undertrykkelse, ægteskab og fertilitet i preussiske amter. Analysen adskiller religiøs eksponering fra overlappende etniske politikker og finder ingen robust ændring i den ægteskabelige fertilitet.',
    technologies: ['Historisk demografi', 'Paneldata', 'Difference-in-differences'],
    credits: 'Anton Meier Ebsen Jørgensen. Kursusopgave i demografi, Københavns Universitet. Underviser: Casper Worm Hansen. Afleveret 29. maj 2026.',
    question: 'Ændrede Kulturkampfen ægteskab og fertilitet i mere katolske preussiske amter, og kan sammenhængen med religionspolitikken adskilles fra politikker rettet mod etniske polakker?',
    data: 'Vitalstatistik og folketællingsdata på amtsniveau fra Galloway Prussia Database. Hovedanalysen dækker 1867–1890 og kombinerer fertilitets- og ægteskabsrater med den katolske befolkningsandel i 1871 og et mål for polsk politisk opbakning. Befolkningsgrundlaget og konstruktionen af fertilitetsrater kræver særlig opmærksomhed.',
    method: 'Et difference-in-differences-design med kontinuert eksponering interagerer den katolske andel før politikken med perioden efter 1873. Analysen bruger amts- og årsfaste effekter samt standardfejl klynget på amtsniveau. Tidsforløb, regionale sammenligninger, event-study-diagnostik og en interaktion med etnicitet belyser alternative forklaringer.',
    findings: 'Opgaven finder ingen robust ændring i den ægteskabelige fertilitet. Negative sammenhænge for fødsels- og ægteskabsrater er koncentreret i polske regioner, og tidsforløbet gør det vanskeligt at tilskrive dem Kulturkampfen alene. Resultaterne er kvalificerede empiriske fund, ikke et entydigt kausalt estimat.',
    limitations: 'Katolicisme og polsk etnicitet overlapper stærkt i visse regioner. Samtidige germaniseringspolitikker, forskellige fertilitetstrends og målevalg vanskeliggør identifikation. Et nulestimat viser ikke i sig selv, at religion var uden demografisk betydning.'
  },
  {
    id: 'master-thesis', title: 'Dansk Vestindien', subtitle: 'Slaveriets økonomiske historie på St. Croix',
    status: 'Fælles kandidatspeciale · I gang · Forventet januar 2027', kind: 'ongoing',
    meta: 'Cand.polit. · Københavns Universitet · Vejleder: Paul Sharp',
    description: 'Et igangværende fælles speciale om slaveriets økonomiske historie i Dansk Vestindien med historiske kilder, konstruktion af arkivdata og kvantitativ analyse. Udkastet er ikke en afsluttet eller publiceret artikel.',
    technologies: ['Økonomisk historie', 'Historiske data', 'Håndskriftsgenkendelse'],
    credits: 'Fælles speciale af Jonas Skov Nielsen, Sheng Ye Michael Chen og Anton Meier Ebsen Jørgensen. Københavns Universitet. Vejleder: Paul Sharp. Arbejdstitel; projektet er i gang.',
    question: 'Hvordan kan historiske kilder belyse slaveriets økonomi på St. Croix i Dansk Vestindien?',
    data: 'Udkastet anvender historisk materiale om St. Croix og eksisterende koloniale data. Arbejdsgangen omfatter transskription af håndskrevne danske kilder med Transkribus og kontrol af den maskingenererede tekst, før kilderne omsættes til strukturerede forskningsdata.',
    method: 'Historisk kildekritik, datakonstruktion og kvantitativ økonomisk-historisk analyse. Håndskriftsgenkendelse understøtter transskriptionen, men erstatter ikke validering af navne, enheder, dækning og kildernes betydning. Den empiriske specifikation er under udvikling.',
    findings: 'Specialet er i gang. Her præsenteres ingen endelige estimater eller konklusioner, og det ufærdige udkast udbydes ikke som en downloadbar publikation.',
    limitations: 'Arkivernes dækning, transskriptionsfejl og ændringer i historiske definitioner kan påvirke datasættet. Det endelige forskningsspørgsmål, analyseudvalg og de empiriske udsagn dokumenteres med det afsluttede speciale.'
  },
  {
    id: 'genai-inequality', title: 'Does GenAI Help Those Who Need It Most?',
    subtitle: 'Et foreslået studie af generativ AI og uddannelsesulighed',
    status: 'Forskningsforslag i gruppe · januar 2026', kind: 'proposal', grade: '10',
    meta: 'AI for Humanity · Københavns Universitet · Kursuskarakter: 10',
    description: 'Et forskningsforslag i gruppe om socioøkonomiske forskelle i sammenhængen mellem GenAI-brug og elevers præstationer. Forslaget anvender causal forests som mulig metode og diskuterer begrænsninger ved frivillig anvendelse. Der påstås ikke indsamlede data eller empiriske resultater.',
    technologies: ['Forskningsdesign', 'Causal forests (foreslået)', 'AI og ulighed'],
    credits: 'Forskningsforslag af Jonas Amassa Skov Nielsen, Sheng Ye Michael Chen og Anton Meier Ebsen Jørgensen på AI for Humanity: Machine Decisions, Learning and Societal Consequences, Københavns Universitet, januar 2026. Anton var hovedbidragyder til den empiriske strategi. Karakteren gælder kurset, ikke et publiceret studie.',
    question: 'Varierer sammenhængen mellem GenAI-brug og faglige præstationer med elevernes socioøkonomiske baggrund?',
    data: 'Forslaget lægger op til en spørgeskemaundersøgelse koblet med karakterdata for cirka 600–800 elever på 3–6 danske gymnasier. Det er foreslåede stikprøvestørrelser, ikke et eksisterende datasæt. Adgang, skoleaftaler og forsvarlig behandling af elevdata skal etableres.',
    method: 'Den foreslåede analyse bruger causal forests til at undersøge heterogenitet i karakterændringer forbundet med høj versus lav GenAI-brug, betinget på observerede elevkarakteristika. Designet er observationelt: anvendelsen er frivillig og selvrapporteret, ikke randomiseret.',
    findings: 'Dette er et forskningsdesign, ikke et afsluttet empirisk studie. Det indeholder ingen indsamlet stikprøve, estimeret model, målte behandlingseffekter eller fastslåede politikkonklusioner.',
    limitations: 'Uobserveret motivation, undervisningspraksis og skoleregler kan påvirke både AI-brug og karakterer. En causal forest løser ikke denne selektion. Uden en troværdig identifikationsantagelse vil estimater beskrive betingede sammenhænge snarere end identificerede kausale effekter.'
  }
];
export function getAcademicProjects(lang: ResearchLanguage): AcademicProject[] {
  const prefix = lang === 'da' ? '' : '/en';
  return (lang === 'da' ? danish : english).map(project => ({ ...project, url: `${prefix}/projects/${project.id}` }));
}
/** Preserve older coursework while replacing outdated summaries of these projects. */
export interface CvProject {
  title: string; description: string; url?: string; tag?: string; meta?: string;
  technologies?: string[]; categories?: string[];
  highlights?: { label: string; value: string }[];
  video?: string; blueprint?: string;
  links?: { text: string; href: string; icon?: string }[];
}
export function withAcademicProjects(projects: CvProject[], lang: ResearchLanguage): CvProject[] {
  const academic = getAcademicProjects(lang).map(project => ({ ...project, tag: project.status, categories: ['tech', 'core'], links: [] }));
  const replaced = /\/projects\/(demography-project|master-thesis|slavery-st-croix|genai-inequality)\/?$/;
  return [...academic, ...projects.filter(project => !replaced.test(project.url || ''))];
}
