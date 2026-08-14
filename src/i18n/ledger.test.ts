import { describe, it, expect } from 'vitest';
import { ledgerCopy, getLedgerCopy, type LedgerLang } from './ledger';
import { ACHIEVEMENTS, RANK_THRESHOLDS, rankFor, rankProgress } from '../lib/gamification';

// The copy lives apart from the entry definitions so the client bundle stays
// text-free, which means nothing at the type level stops one language drifting
// out of sync with another. A missing string would otherwise surface as a blank
// card on the German page and nowhere else.

const LANGS: LedgerLang[] = ['da', 'en', 'de'];

describe('ledger copy parity', () => {
    for (const lang of LANGS) {
        describe(lang, () => {
            const copy = ledgerCopy[lang];

            it('has a title and description for every entry', () => {
                for (const { id } of ACHIEVEMENTS) {
                    const entry = copy.entries[id];
                    expect(entry, `${lang}: missing entry "${id}"`).toBeDefined();
                    expect(entry.title.trim(), `${lang}.${id}.title`).not.toBe('');
                    expect(entry.description.trim(), `${lang}.${id}.description`).not.toBe('');
                }
            });

            it('has no entries that are not in ACHIEVEMENTS', () => {
                const known = new Set(ACHIEVEMENTS.map(a => a.id));
                const orphans = Object.keys(copy.entries).filter(id => !known.has(id));
                expect(orphans).toEqual([]);
            });

            it('names one rank per threshold', () => {
                expect(copy.ranks).toHaveLength(RANK_THRESHOLDS.length);
                for (const rank of copy.ranks) {
                    expect(rank.trim()).not.toBe('');
                }
            });

            it('fills in every chrome string', () => {
                for (const [key, value] of Object.entries(copy.ui)) {
                    expect(value.trim(), `${lang}.ui.${key}`).not.toBe('');
                }
            });
        });
    }

    it('uses the same set of chrome keys in every language', () => {
        const reference = Object.keys(ledgerCopy.en.ui).sort();
        for (const lang of LANGS) {
            expect(Object.keys(ledgerCopy[lang].ui).sort(), lang).toEqual(reference);
        }
    });

    it('falls back to Danish for an unknown language', () => {
        expect(getLedgerCopy('fr')).toBe(ledgerCopy.da);
        expect(getLedgerCopy('de')).toBe(ledgerCopy.de);
    });
});

describe('rank thresholds', () => {
    const total = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);

    it('makes every rank reachable', () => {
        // The original curve was Math.floor(xp / 1000) + 1, which topped out
        // well below the end of the ladder — the last rank never rendered.
        // Derived from ACHIEVEMENTS rather than hardcoded, so adding entries
        // re-checks this instead of quietly invalidating it.
        expect(total).toBeGreaterThanOrEqual(RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1]);
        expect(rankFor(total)).toBe(RANK_THRESHOLDS.length);
    });

    it('keeps the top rank behind the 404 entry', () => {
        const withoutVoidWalker = total - ACHIEVEMENTS.find(a => a.id === 'void_walker')!.xp;
        expect(rankFor(withoutVoidWalker)).toBe(RANK_THRESHOLDS.length - 1);
    });

    it('ascends', () => {
        for (let i = 1; i < RANK_THRESHOLDS.length; i++) {
            expect(RANK_THRESHOLDS[i]).toBeGreaterThan(RANK_THRESHOLDS[i - 1]);
        }
    });

    it('maps thresholds to their rank exactly', () => {
        RANK_THRESHOLDS.forEach((threshold, i) => {
            expect(rankFor(threshold)).toBe(i + 1);
            if (i > 0) expect(rankFor(threshold - 1)).toBe(i);
        });
    });

    it('survives junk input', () => {
        expect(rankFor(NaN)).toBe(1);
        expect(rankFor(-100)).toBe(1);
        expect(rankProgress(NaN)).toBe(0);
        expect(rankProgress(total)).toBe(1);
        expect(rankProgress(RANK_THRESHOLDS[1])).toBe(0);
    });
});

describe('entry definitions', () => {
    it('has unique ids', () => {
        const ids = ACHIEVEMENTS.map(a => a.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('ships no display text to the client', () => {
        for (const achievement of ACHIEVEMENTS) {
            expect(achievement).not.toHaveProperty('title');
            expect(achievement).not.toHaveProperty('description');
        }
    });
});
