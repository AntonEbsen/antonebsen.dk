import { describe, it, expect } from 'vitest';
import { rewindIndex } from './message-actions';

/**
 * The rest of message-actions.ts is DOM construction, which this project has no test
 * environment for (vitest runs in `node`). The rewind is the part where being wrong is
 * not obviously wrong, so it is the part that is pure and tested.
 */
describe('rewindIndex', () => {
    const turns = (...roles: string[]) => roles.map((role) => ({ role }));

    it('cuts at the question, not at the answer', () => {
        // Slicing to this index leaves ['user','ai'] — the earlier exchange intact,
        // the retried question gone because the send path re-adds it.
        expect(rewindIndex(turns('user', 'ai', 'user', 'ai'))).toBe(2);
    });

    it('retries the last question when the answer never arrived', () => {
        // What pressing stop leaves behind: a question with nothing after it.
        expect(rewindIndex(turns('user', 'ai', 'user'))).toBe(2);
    });

    it('handles a transcript with a single question', () => {
        expect(rewindIndex(turns('user'))).toBe(0);
    });

    it('reports nothing to retry on an empty transcript', () => {
        expect(rewindIndex([])).toBe(-1);
    });

    it('reports nothing to retry when no question was ever asked', () => {
        // The greeting bubble is rendered, not stored, but a transcript of only
        // assistant turns must not send an empty message.
        expect(rewindIndex(turns('ai', 'ai'))).toBe(-1);
    });

    it('ignores entries with a missing or unexpected role', () => {
        expect(rewindIndex([{ role: 'user' }, {}, { role: 'system' }])).toBe(0);
    });

    it('slicing to the returned index drops the question and everything after it', () => {
        const history = [
            { role: 'user', text: 'first' },
            { role: 'ai', text: 'answer one' },
            { role: 'user', text: 'second' },
            { role: 'ai', text: 'answer two' },
        ];
        expect(history.slice(0, rewindIndex(history))).toEqual([
            { role: 'user', text: 'first' },
            { role: 'ai', text: 'answer one' },
        ]);
    });
});
