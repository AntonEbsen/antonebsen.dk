import { describe, it, expect } from 'vitest';
import { budgetMessage } from './budget-copy';

describe('budgetMessage', () => {
    it('speaks Danish on the Danish site', () => {
        // The guard's own string is English, and Danish is this site's default. At the
        // old 450-a-month cap nobody was going to read it; at 63 it is a plausible
        // Tuesday, and the first thing they read should not be in the wrong language.
        expect(budgetMessage('month', 'da', 'FALLBACK')).toContain('måned');
        expect(budgetMessage('day', 'da', 'FALLBACK')).toContain('i dag');
        expect(budgetMessage('ip', 'da', 'FALLBACK')).toContain('grænse');
    });

    it('covers all three site languages for every scope', () => {
        for (const lang of ['da', 'en', 'de']) {
            for (const scope of ['month', 'day', 'ip', 'unavailable'] as const) {
                const msg = budgetMessage(scope, lang, 'FALLBACK');
                expect(msg, `${lang}/${scope}`).not.toBe('FALLBACK');
                expect(msg.length, `${lang}/${scope}`).toBeGreaterThan(10);
            }
        }
    });

    it('says different things for different scopes', () => {
        // "this month" and "today" are different news for the visitor: one means come
        // back tomorrow, the other means come back in weeks.
        const month = budgetMessage('month', 'da', 'x');
        const day = budgetMessage('day', 'da', 'x');
        expect(month).not.toBe(day);
    });

    it('falls back rather than going blank', () => {
        // An unknown language, or a scope added to budget.ts before this file catches
        // up, must not produce an empty bubble.
        expect(budgetMessage('month', 'fr', 'FALLBACK')).toBe('FALLBACK');
        expect(budgetMessage('nonsense' as never, 'da', 'FALLBACK')).toBe('FALLBACK');
    });

    it('defaults to Danish when no language is given', () => {
        expect(budgetMessage('month', undefined, 'FALLBACK')).toContain('måned');
    });
});
