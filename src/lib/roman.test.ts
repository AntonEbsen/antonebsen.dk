import { describe, it, expect } from 'vitest';
import { roman, romanDate } from './roman';

// The helper this replaced lived inside LedgerGrid.astro and only carried
// [10, 9, 5, 4, 1] — enough for folio numbers up to xviii, but roman(2026)
// would have emitted 202 x's. Years are the reason it needs the full table.

describe('roman', () => {
    it('handles the subtractive pairs', () => {
        expect(roman(4)).toBe('iv');
        expect(roman(9)).toBe('ix');
        expect(roman(40)).toBe('xl');
        expect(roman(90)).toBe('xc');
        expect(roman(400)).toBe('cd');
        expect(roman(900)).toBe('cm');
    });

    it('handles years', () => {
        expect(roman(2026)).toBe('mmxxvi');
        expect(roman(1994)).toBe('mcmxciv');
        expect(roman(1130)).toBe('mcxxx'); // the first Pipe Roll
    });

    it('covers the folio range the ledger uses', () => {
        expect(roman(1)).toBe('i');
        expect(roman(18)).toBe('xviii');
        expect(roman(30)).toBe('xxx');
    });

    it('returns nothing rather than throwing on junk', () => {
        // There is no Roman zero, and this runs in a render path.
        expect(roman(0)).toBe('');
        expect(roman(-1)).toBe('');
        expect(roman(NaN)).toBe('');
        expect(roman(Infinity)).toBe('');
    });

    it('floors fractions', () => {
        expect(roman(3.9)).toBe('iii');
    });
});

describe('romanDate', () => {
    it('renders day, month and year in that order', () => {
        // Month is 0-indexed in the Date constructor: 7 = August.
        expect(romanDate(new Date(2026, 7, 13).getTime())).toBe('xiii · viii · mmxxvi');
    });

    it('handles the first of the month', () => {
        expect(romanDate(new Date(2026, 0, 1).getTime())).toBe('i · i · mmxxvi');
    });

    it('returns nothing for an unusable timestamp', () => {
        expect(romanDate(NaN)).toBe('');
        expect(romanDate(Infinity)).toBe('');
    });
});
