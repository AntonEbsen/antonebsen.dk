import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    parseRecord,
    fetchRecord,
    profileUrl,
    sameAsProfiles,
    matchesUcph,
    startYear,
    isOngoing,
    earliestStartYear,
    orcidBacks,
    nameAgreesWithRecord,
    PUBLISHED_NAME,
    record,
    ORCID_URI,
    UCPH_ROR,
    ONGOING_TOKENS,
} from './orcid';
import cvDa from '../content/cv/da.json';
import cvEn from '../content/cv/en.json';
import cvDe from '../content/cv/de.json';

// A trimmed copy of the real https://pub.orcid.org/v3.0/<id>/record response,
// keeping one education (fully dated), one employment (open-ended, which is how
// ORCID says "ongoing") and one researcher URL with a tracking query string.
const RECORD = {
    'orcid-identifier': { uri: ORCID_URI, path: '0009-0006-4129-8044', host: 'orcid.org' },
    person: {
        name: { 'given-names': { value: 'Anton Meier' }, 'family-name': { value: 'Ebsen' } },
        'researcher-urls': {
            'researcher-url': [
                { 'url-name': 'Personal Website', url: { value: 'https://antonebsen.dk/' } },
                { 'url-name': 'ResearchGate', url: { value: 'https://www.researchgate.net/profile/X?ev=hdr_xprf&_tp=abc' } },
            ],
        },
    },
    'activities-summary': {
        educations: {
            'affiliation-group': [{
                summaries: [{
                    'education-summary': {
                        'role-title': 'Bachelor of Science, Economics',
                        'department-name': 'Department of Economics',
                        organization: {
                            name: 'University of Copenhagen',
                            'disambiguated-organization': {
                                'disambiguated-organization-identifier': UCPH_ROR,
                                'disambiguation-source': 'ROR',
                            },
                        },
                        'start-date': { year: { value: '2021' }, month: { value: '09' }, day: { value: '01' } },
                        'end-date': { year: { value: '2024' }, month: { value: '05' }, day: { value: '24' } },
                    },
                }],
            }],
        },
        employments: {
            'affiliation-group': [{
                summaries: [{
                    'employment-summary': {
                        'role-title': "Master's Student",
                        'department-name': 'Department of Economics',
                        organization: { name: 'University of Copenhagen' },
                        'start-date': { year: { value: '2024' }, month: { value: '09' }, day: null },
                        'end-date': null,
                    },
                }],
            }],
        },
        works: { group: [] },
    },
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('parseRecord', () => {
    it('flattens educations and employments into one list', () => {
        const record = parseRecord(RECORD, '2026-08-27');

        expect(record.name).toBe('Anton Meier Ebsen');
        expect(record.affiliations).toHaveLength(2);
        expect(record.affiliations[0]).toEqual({
            kind: 'education',
            role: 'Bachelor of Science, Economics',
            department: 'Department of Economics',
            organization: 'University of Copenhagen',
            ror: UCPH_ROR,
            start: '2021-09-01',
            end: '2024-05-24',
        });
    });

    it('reads a missing end-date as ongoing, and a missing day as a month', () => {
        const employment = parseRecord(RECORD, '2026-08-27').affiliations[1];

        expect(employment.start).toBe('2024-09');
        expect(employment.end).toBeUndefined();
    });

    it('only takes a ROR identifier when ROR is the disambiguation source', () => {
        const other = structuredClone(RECORD);
        const summary = other['activities-summary'].educations['affiliation-group'][0].summaries[0]['education-summary'];
        summary.organization['disambiguated-organization']['disambiguation-source'] = 'RINGGOLD';

        expect(parseRecord(other, '2026-08-27').affiliations[0].ror).toBeUndefined();
    });

    it('returns an empty works list rather than throwing when there are none', () => {
        expect(parseRecord(RECORD, '2026-08-27').works).toEqual([]);
    });
});

describe('fetchRecord', () => {
    it('throws on a non-OK response instead of writing a thinner snapshot', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' }));

        await expect(fetchRecord()).rejects.toThrow('503');
    });
});

describe('profileUrl', () => {
    it('strips the tracking query string off the ResearchGate link', () => {
        expect(profileUrl('https://www.researchgate.net/profile/X?ev=hdr_xprf&_tp=abc'))
            .toBe('https://www.researchgate.net/profile/X');
    });

    it('strips a trailing slash so the same profile is not listed twice', () => {
        expect(profileUrl('https://antonebsen.dk/')).toBe('https://antonebsen.dk');
    });
});

describe('sameAsProfiles', () => {
    const profiles = sameAsProfiles(record, ['https://x.com/antonebsen']);

    it('leads with the ORCID URI', () => {
        expect(profiles[0]).toBe(ORCID_URI);
    });

    it('drops the personal website, which is the subject rather than another profile', () => {
        expect(profiles).not.toContain('https://antonebsen.dk');
    });

    it('carries no tracking parameters or duplicates', () => {
        expect(profiles.every((url) => !url.includes('?'))).toBe(true);
        expect(new Set(profiles).size).toBe(profiles.length);
    });

    it('is entirely absolute https URLs', () => {
        expect(profiles.every((url) => url.startsWith('https://'))).toBe(true);
    });
});

/**
 * The point of the integration: the public record and the CV must not drift apart.
 *
 * Field equality would be the obvious test and it would be wrong. The two disagree
 * on shape and wording for good reasons — the CV collapses the BSc and the MSc into
 * one line, spells the university in three languages, and writes periods as prose —
 * so a strict comparison fails on the first run and gets muted within a week. These
 * assert only what is genuinely comparable.
 */
describe('the CV agrees with the public ORCID record', () => {
    const cvs: [string, any][] = [['da', cvDa], ['en', cvEn], ['de', cvDe]];

    const ucphEntry = (cv: any) => (cv.education ?? []).find((e: any) => matchesUcph(e.institution));

    it.each(cvs)('%s names the university the record names', (_lang, cv) => {
        expect(ucphEntry(cv)).toBeDefined();
    });

    it.each(cvs)('%s starts in the year the record starts', (_lang, cv) => {
        const expected = earliestStartYear(record, matchesUcph);

        expect(expected).toBe(2021);
        expect(startYear(ucphEntry(cv).period)).toBe(expected);
    });

    it.each(cvs)('%s reads as ongoing, because the record has no end date', (lang, cv) => {
        const stillThere = record.affiliations.some((a) => matchesUcph(a.organization) && !a.end);

        expect(stillThere).toBe(true);
        expect(isOngoing(ucphEntry(cv).period, lang)).toBe(true);
    });

    it('has an ongoing token for every language with a CV', () => {
        for (const [lang] of cvs) expect(ONGOING_TOKENS[lang]).toBeTruthy();
    });

    it('still carries the ROR identifier the site publishes as structured data', () => {
        const rors = record.affiliations.map((a) => a.ror).filter(Boolean);

        expect(rors).toContain(UCPH_ROR);
    });
});

describe('the record names the same person the site does', () => {
    it('agrees with the published name today', () => {
        // Containment, not equality: ORCID holds no credit name, so the record says
        // "Anton Meier Ebsen" where the site says "…Jørgensen". Tighten this to ===
        // once the credit name is set on orcid.org.
        expect(nameAgreesWithRecord(record.name)).toBe(true);
    });

    it('still catches a record that acquires the wrong name', () => {
        expect(nameAgreesWithRecord('Anton Nielsen')).toBe(false);
        expect(nameAgreesWithRecord('Anton Meier Ebsler')).toBe(false);
    });

    it('fails on an empty name rather than passing it as trivially contained', () => {
        expect(nameAgreesWithRecord('')).toBe(false);
        expect(nameAgreesWithRecord('   ')).toBe(false);
    });

    it('would pass unchanged once the credit name is added', () => {
        expect(nameAgreesWithRecord(PUBLISHED_NAME)).toBe(true);
    });
});

describe('orcidBacks', () => {
    it('backs the university, in every spelling the CV uses', () => {
        for (const alias of ['Københavns Universitet', 'University of Copenhagen', 'Universität Kopenhagen']) {
            expect(orcidBacks(alias)?.organization, alias).toBe('University of Copenhagen');
        }
    });

    it('backs nothing for institutions absent from the record', () => {
        // The load-bearing case. A marker that appeared on these too would be
        // decoration rather than provenance.
        expect(orcidBacks('Djøf')).toBeUndefined();
        expect(orcidBacks('Handelsgymnasiet Lolland-Falster')).toBeUndefined();
        expect(orcidBacks('Celf')).toBeUndefined();
        expect(orcidBacks(undefined)).toBeUndefined();
    });

    it('does not match on substrings', () => {
        // `includes("Copenhagen")` was the bug this replaces; it also would have
        // matched a different institution in the same city.
        expect(orcidBacks('Copenhagen Business School')).toBeUndefined();
        expect(orcidBacks('University of Copenhagen Alumni Association')).toBeUndefined();
    });

    it('marks both UCPH rows a CV timeline would show', () => {
        const backed = ['Københavns Universitet', 'Djøf', 'University of Copenhagen', 'Celf']
            .map((i) => Boolean(orcidBacks(i)));
        expect(backed).toEqual([true, false, true, false]);
    });
});

describe('reconciliation helpers', () => {
    it('matches the university across all three spellings', () => {
        expect(matchesUcph('Københavns Universitet')).toBe(true);
        expect(matchesUcph('University of Copenhagen')).toBe(true);
        expect(matchesUcph('Universität Kopenhagen')).toBe(true);
        expect(matchesUcph('Aarhus Universitet')).toBe(false);
        expect(matchesUcph(undefined)).toBe(false);
    });

    it('reads the start year through either dash', () => {
        expect(startYear('2021 – nu')).toBe(2021);
        expect(startYear('2018 - 2021')).toBe(2018);
        expect(startYear('nu')).toBeUndefined();
    });

    it('only calls a period ongoing in its own language', () => {
        expect(isOngoing('2021 – nu', 'da')).toBe(true);
        expect(isOngoing('2021 – present', 'en')).toBe(true);
        expect(isOngoing('2021 – heute', 'de')).toBe(true);
        expect(isOngoing('2021 – 2024', 'en')).toBe(false);
    });
});
