import { describe, it, expect } from 'vitest';
import { chartPalette, CHAT_THEME, CHAT_ACTION_THEME } from './chat-theme';

describe('chartPalette', () => {
    it('builds every entry from the two accents it was given', () => {
        const ramp = chartPalette('1 2 3', '4 5 6');
        for (const colour of ramp) {
            expect(colour).toMatch(/^rgba\((1, 2, 3|4, 5, 6), 0\.\d+\)$/);
        }
    });

    it('never repeats a colour across an eight-series chart', () => {
        // The failure this guards is silent: two series drawn the same colour reads as
        // a chart, just a wrong one.
        const ramp = chartPalette();
        expect(ramp.length).toBeGreaterThanOrEqual(8);
        expect(new Set(ramp).size).toBe(ramp.length);
    });

    it('alternates the two hues before either repeats', () => {
        // Nearly every chart the assistant draws has two or three series, so the first
        // entries have to be maximally separated — terracotta against moss.
        const ramp = chartPalette('1 1 1', '9 9 9');
        expect(ramp[0]).toContain('1, 1, 1');
        expect(ramp[1]).toContain('9, 9, 9');
        expect(ramp[2]).toContain('1, 1, 1');
    });

    it('falls back to the committed tokens when a property is missing or malformed', () => {
        // getPropertyValue returns '' for an undefined custom property.
        for (const bad of ['', '   ', 'not channels']) {
            const ramp = chartPalette(bad, bad);
            expect(ramp[0]).toBe('rgba(212, 121, 79, 0.85)');
            expect(ramp[1]).toBe('rgba(111, 158, 123, 0.85)');
        }
    });

    it('accepts comma-separated channels as well as space-separated', () => {
        expect(chartPalette('1, 2, 3', '4,5,6')[0]).toBe('rgba(1, 2, 3, 0.85)');
    });

    it('carries no colour of its own', () => {
        // The whole point: the ramp follows the tokens. A literal here would be the bug
        // returning, so assert the source has no stray rgb/hex beyond the fallbacks.
        const ramp = chartPalette('7 7 7', '8 8 8');
        expect(ramp.join(' ')).not.toMatch(/#[0-9a-f]{3,6}/i);
        expect(ramp.every((c) => c.includes('7, 7, 7') || c.includes('8, 8, 8'))).toBe(true);
    });
});

describe('the shared theme', () => {
    it('carries no off-palette colour', () => {
        // This is the regression guard for the whole retheme miss: the full-page chat
        // kept `purple-*` because its copy of these strings lived in a page script
        // rather than a template, so the sweep never saw it.
        const all = [...Object.values(CHAT_THEME), ...Object.values(CHAT_ACTION_THEME)].join(' ');
        expect(all).not.toMatch(/\b(purple|indigo|violet|blue|emerald|slate|gray|neutral|zinc)-\d/);
        expect(all).not.toMatch(/#[0-9a-f]{3,6}/i);
        expect(all).not.toMatch(/rgba?\(/);
    });
});
