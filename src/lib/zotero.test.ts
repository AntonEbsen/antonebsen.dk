import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseItems, itemYear, bareDoi, fetchLibrary, library, ZOTERO_GROUP_ID } from './zotero';

// A trimmed copy of the real https://api.zotero.org/groups/5801880/items/top
// response: a journal article with a DOI, an institutional author, a note (which
// `top` excludes but the parser drops anyway), and an item with neither creators
// nor a date.
const RESPONSE = [
    {
        key: 'ABCD1234',
        data: {
            key: 'ABCD1234',
            itemType: 'journalArticle',
            title: 'Did Austerity Cause Brexit?',
            creators: [{ firstName: 'Thiemo', lastName: 'Fetzer', creatorType: 'author' }],
            date: '2019/11',
            publicationTitle: 'American Economic Review',
            DOI: '10.1257/aer.20181164',
        },
    },
    {
        key: 'EFGH5678',
        data: {
            key: 'EFGH5678',
            itemType: 'report',
            title: 'Globalisation and the Future of the Welfare State',
            // Institutional authors carry `name` instead of first/last.
            creators: [{ name: 'IZA Institute of Labor Economics', creatorType: 'author' }],
            date: '2014/04',
            publisher: 'IZA Policy Papers',
        },
    },
    {
        key: 'NOTE0001',
        data: { key: 'NOTE0001', itemType: 'note', note: '<p>Read before the seminar</p>' },
    },
    {
        key: 'ATCH0001',
        data: { key: 'ATCH0001', itemType: 'attachment', title: 'Full Text PDF', linkMode: 'imported_url' },
    },
    {
        key: 'BARE0001',
        data: { key: 'BARE0001', itemType: 'preprint', title: 'An untitled author, undated', creators: [] },
    },
];

afterEach(() => {
    vi.restoreAllMocks();
});

describe('parseItems', () => {
    it('keeps the works and drops notes and attachments', () => {
        const items = parseItems(RESPONSE);

        expect(items).toHaveLength(3);
        expect(items.map((i) => i.itemType)).toEqual(['journalArticle', 'report', 'preprint']);
    });

    it('reads a personal author by last name and an institutional one by name', () => {
        const [article, report] = parseItems(RESPONSE);

        expect(article.creators).toEqual(['Fetzer']);
        expect(report.creators).toEqual(['IZA Institute of Labor Economics']);
    });

    it('takes the venue from whichever field the item type uses', () => {
        const [article, report] = parseItems(RESPONSE);

        // journalArticle carries publicationTitle, report carries publisher.
        expect(article.publication).toBe('American Economic Review');
        expect(report.publication).toBe('IZA Policy Papers');
    });

    it('keeps the DOI where there is one, and omits it where there is not', () => {
        const [article, report] = parseItems(RESPONSE);

        expect(article.doi).toBe('10.1257/aer.20181164');
        expect(report.doi).toBeUndefined();
    });

    it('survives an item with no creators and no date', () => {
        const bare = parseItems(RESPONSE)[2];

        expect(bare.creators).toEqual([]);
        expect(bare.date).toBeUndefined();
        expect(bare.title).toBe('An untitled author, undated');
    });

    it('returns an empty list rather than throwing on an empty library', () => {
        expect(parseItems([])).toEqual([]);
        expect(parseItems(undefined as any)).toEqual([]);
    });
});

describe('bareDoi', () => {
    it('strips the resolver prefix contributors sometimes paste', () => {
        // Both forms are in the real library. Left alone, the second rendered as
        // https://doi.org/https://doi.org/10.1016/… and resolved to nothing.
        expect(bareDoi('https://doi.org/10.1016/j.jinteco.2017.01.004')).toBe('10.1016/j.jinteco.2017.01.004');
        expect(bareDoi('http://dx.doi.org/10.1257/aer.20181164')).toBe('10.1257/aer.20181164');
        expect(bareDoi('doi: 10.3386/w21812')).toBe('10.3386/w21812');
    });

    it('leaves an already-bare DOI alone', () => {
        expect(bareDoi('10.3386/w21812')).toBe('10.3386/w21812');
    });

    it('gives nothing back for an absent or empty DOI', () => {
        expect(bareDoi(undefined)).toBeUndefined();
        expect(bareDoi('   ')).toBeUndefined();
    });
});

describe('itemYear', () => {
    it('reads the year out of every date format Zotero stores', () => {
        // These four all occur in the real library.
        expect(itemYear('2016/09')).toBe('2016');
        expect(itemYear('1999-12-03')).toBe('1999');
        expect(itemYear('2018')).toBe('2018');
        expect(itemYear('2015/12/21')).toBe('2015');
    });

    it('gives nothing back for an undated or unparseable item', () => {
        expect(itemYear(undefined)).toBeUndefined();
        expect(itemYear('n.d.')).toBeUndefined();
        expect(itemYear('')).toBeUndefined();
    });
});

describe('fetchLibrary', () => {
    it('throws on a non-OK response rather than writing a thinner library', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: new Headers(),
        }));

        await expect(fetchLibrary()).rejects.toThrow('404');
    });

    it('stands down when Zotero asks for a backoff', async () => {
        // The API asks clients to back off rather than retry into a rate limit, and
        // this is a hand-run script against a free service.
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({ Backoff: '30' }),
            json: async () => [],
        }));

        await expect(fetchLibrary()).rejects.toThrow('30s backoff');
    });
});

describe('the committed snapshot', () => {
    it('is the group this module names', () => {
        expect(library.groupId).toBe(ZOTERO_GROUP_ID);
        expect(library.url).toContain(ZOTERO_GROUP_ID);
    });

    it('holds works rather than an empty shell', () => {
        // /team renders this directly, so an empty snapshot would silently empty the
        // page. The sync script fails loudly instead; this catches a bad commit.
        expect(library.items.length).toBeGreaterThan(0);
        expect(library.version).toBeGreaterThan(0);
    });

    it('carries no notes or attachments', () => {
        for (const item of library.items) {
            expect(item.itemType).not.toBe('note');
            expect(item.itemType).not.toBe('attachment');
        }
    });

    it('gives every entry something to render', () => {
        for (const item of library.items) {
            expect(item.title.trim().length, `${item.key} has a title`).toBeGreaterThan(0);
        }
    });

    it('stores bare DOIs, so the pages can prefix a resolver safely', () => {
        // Two entries were pasted in as full doi.org URLs, and /team renders
        // `https://doi.org/${item.doi}` — which produced a doubled prefix resolving
        // to nothing. Caught by an e2e assertion; guarded here so a future sync of a
        // freshly pasted URL fails at the unit level instead.
        for (const item of library.items) {
            if (!item.doi) continue;
            expect(item.doi, `${item.key} DOI`).not.toMatch(/^https?:\/\//);
            expect(item.doi, `${item.key} DOI`).toMatch(/^10\./);
        }
    });
});
