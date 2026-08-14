import { describe, it, expect } from 'vitest';
import { toLongS } from './longs';

describe('toLongS', () => {
    it('leaves a word-final s short', () => {
        expect(toLongS('his')).toBe('his');
        expect(toLongS('the accounts')).toBe('the accounts');
    });

    it('makes a medial s long', () => {
        expect(toLongS('sit')).toBe('ſit');
        expect(toLongS('passage')).toBe('paſſage');
    });

    it('handles a doubled s at the end of a word', () => {
        // Long then short, which is exactly how it was set.
        expect(toLongS('Congress')).toBe('Congreſs');
    });

    it('leaves s before an apostrophe short', () => {
        expect(toLongS("s'il")).toBe("s'il");
    });

    it('never touches a capital S', () => {
        expect(toLongS('Sortes')).toBe('Sortes');
        expect(toLongS('SORTES')).toBe('SORTES');
    });

    it('treats Danish and German letters as letters', () => {
        // 'ø' and 'ä' must count, or the s before them would wrongly stay short.
        expect(toLongS('besøgende')).toBe('beſøgende');
        expect(toLongS('Straße')).toBe('Straße');
        expect(toLongS('spät')).toBe('ſpät');
    });

    it('leaves text with no lowercase s alone', () => {
        expect(toLongS('1130 · mmxxvi')).toBe('1130 · mmxxvi');
        expect(toLongS('')).toBe('');
    });

    it('is idempotent — running it twice changes nothing further', () => {
        const once = toLongS('the passage of his accounts');
        expect(toLongS(once)).toBe(once);
    });
});
