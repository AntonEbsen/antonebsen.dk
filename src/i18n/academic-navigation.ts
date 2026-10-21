/** Keep the application-facing routes focused without removing the wider site. */
export function isAcademicPath(pathname: string) {
  return /^(?:\/en)?(?:\/?|\/cv\/?|\/about\/?|\/contact\/?|\/cliometrics\/?|\/projects\/(?:demography-project|master-thesis|genai-inequality|welfare-state-seminar)\/?)$/.test(pathname);
}

interface NavItem { label: string; url: string; children?: { label: string; url: string; external?: boolean }[] }
export function academicNavigation(lang: string): NavItem[] {
  const da = lang === 'da';
  const prefix = da ? '' : '/en';
  return [
    { label: da ? 'Hjem' : 'Home', url: prefix || '/' },
    { label: da ? 'Forskning' : 'Research', url: prefix + '/cliometrics' },
    { label: 'CV', url: prefix + '/cv' },
    { label: da ? 'Om mig' : 'About', url: prefix + '/about' },
    { label: da ? 'Kontakt' : 'Contact', url: prefix + '/contact' },
    { label: da ? 'Mere' : 'More', url: prefix + '/portfolio', children: [
      { label: da ? 'Alle projekter' : 'All projects', url: prefix + '/portfolio' },
      { label: 'Blog', url: prefix + '/blog' },
      { label: da ? 'Undervisning og samarbejde' : 'Teaching and collaboration', url: prefix + '/services' },
      { label: da ? 'Udvidet profil' : 'Extended profile', url: prefix + '/cv/full' },
      { label: da ? 'Personlige noter' : 'Personal notes', url: prefix + '/notes' },
    ] },
  ];
}
