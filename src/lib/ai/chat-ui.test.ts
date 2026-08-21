import { describe, it, expect } from 'vitest';
import { citationAction } from './chat-ui';

/**
 * The rest of chat-ui.ts is DOM construction, which this project has no test
 * environment for (vitest runs in `node`). The ordering decision is the part where
 * being wrong is not obviously wrong, so it is the part that is pure and tested.
 */
describe('citationAction', () => {
    const act = (o: Partial<Parameters<typeof citationAction>[0]>) =>
        citationAction({ resolved: false, alreadyNumbered: false, dropUnresolved: false, ...o });

    it('numbers a marker whose source has resolved', () => {
        expect(act({ resolved: true })).toBe('number');
    });

    it('keeps an unresolved marker while the answer is still streaming', () => {
        // The regression this whole shape exists to prevent. An answer that calls
        // citeSources on its last line gets no further text event, so a mid-stream pass
        // that removed the marker would have deleted it for good.
        expect(act({ resolved: false, dropUnresolved: false })).toBe('skip');
    });

    it('removes an unresolved marker once the turn is over', () => {
        // Nothing will resolve it now, and a numberless superscript in finished prose
        // is a footnote reference to a footnote that does not exist.
        expect(act({ resolved: false, dropUnresolved: true })).toBe('remove');
    });

    it('leaves an already-numbered marker alone', () => {
        // Numbering runs on both the citations event and every text update, so the same
        // marker is visited repeatedly; without this it would collect a link per pass.
        expect(act({ resolved: true, alreadyNumbered: true })).toBe('skip');
    });

    it('never removes a marker it has already numbered', () => {
        // The final pass sees resolved and unresolved markers together. Only the second
        // kind may be touched.
        expect(act({ resolved: true, alreadyNumbered: true, dropUnresolved: true })).toBe('skip');
        expect(act({ resolved: true, alreadyNumbered: false, dropUnresolved: true })).toBe('number');
    });
});
