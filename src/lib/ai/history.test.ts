import { describe, it, expect } from 'vitest';
import { toApiMessages, HISTORY_WINDOW } from './history';

/** The shape both clients actually write to localStorage. */
const turn = (role: string, text: string) => ({ role, text, persona: 'default', timestamp: 1 });

describe('toApiMessages', () => {
    it('renames the stored assistant role to the one the API accepts', () => {
        // The clients store 'ai'; Anthropic wants 'assistant'. Getting this wrong is a
        // 400 halfway through a session, not a visible bug.
        expect(toApiMessages([turn('user', 'hi'), turn('ai', 'hello')])).toEqual([
            { role: 'user', content: 'hi' },
            { role: 'assistant', content: 'hello' },
        ]);
    });

    it('keeps only the last window of turns', () => {
        const long = Array.from({ length: 30 }, (_, i) =>
            turn(i % 2 === 0 ? 'user' : 'ai', `m${i}`),
        );
        const out = toApiMessages(long);
        expect(out).toHaveLength(HISTORY_WINDOW);
        // The window is taken from the end: the newest turn must survive it.
        expect(out[out.length - 1].content).toBe('m29');
    });

    it('never opens the window on an assistant turn', () => {
        // A window that starts mid-exchange hands the model an answer with no question,
        // which reads as the assistant contradicting itself.
        const long = Array.from({ length: 30 }, (_, i) =>
            turn(i % 2 === 0 ? 'ai' : 'user', `m${i}`),
        );
        const out = toApiMessages(long, 4);
        expect(out[0].role).toBe('user');
        expect(out.length).toBeLessThanOrEqual(4);
    });

    it('merges two user turns in a row rather than sending them', () => {
        // Exactly what pressing stop leaves behind: a question with no answer, then the
        // next question. The API rejects consecutive same-role turns outright.
        const out = toApiMessages([turn('user', 'first'), turn('user', 'second')]);
        expect(out).toEqual([{ role: 'user', content: 'first\n\nsecond' }]);
    });

    it('merges consecutive assistant turns too', () => {
        const out = toApiMessages([turn('user', 'q'), turn('ai', 'a'), turn('ai', 'b')]);
        expect(out).toEqual([
            { role: 'user', content: 'q' },
            { role: 'assistant', content: 'a\n\nb' },
        ]);
    });

    it('alternates strictly, which is what the API requires', () => {
        const out = toApiMessages([
            turn('user', '1'), turn('user', '2'), turn('ai', '3'),
            turn('ai', '4'), turn('user', '5'),
        ]);
        for (let i = 1; i < out.length; i++) {
            expect(out[i].role, `turn ${i}`).not.toBe(out[i - 1].role);
        }
    });

    it('drops empty and whitespace-only turns', () => {
        // An assistant turn stopped before its first token is stored empty.
        const out = toApiMessages([turn('user', 'q'), turn('ai', '   '), turn('user', 'q2')]);
        expect(out).toEqual([{ role: 'user', content: 'q\n\nq2' }]);
    });

    it('ignores entries that are not turns', () => {
        const out = toApiMessages([
            turn('user', 'keep'),
            { role: 'system', text: 'drop' },
            { role: 'user' },
            null,
            'nonsense',
        ]);
        expect(out).toEqual([{ role: 'user', content: 'keep' }]);
    });

    it('returns nothing for anything that is not an array', () => {
        for (const bad of [null, undefined, {}, 'x', 0]) {
            expect(toApiMessages(bad)).toEqual([]);
        }
    });

    it('trims each turn, so stored padding does not reach the model', () => {
        expect(toApiMessages([turn('user', '  padded  ')])).toEqual([
            { role: 'user', content: 'padded' },
        ]);
    });

    it('handles a zero or negative window without throwing', () => {
        expect(toApiMessages([turn('user', 'q')], 0)).toEqual([]);
        expect(toApiMessages([turn('user', 'q')], -1)).toEqual([]);
    });
});
