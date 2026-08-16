import { describe, it, expect } from 'vitest';
import { createEventParser, encodeEvent, readEventStream, type ChatEvent } from './protocol';

function collect(chunks: string[]): ChatEvent[] {
    const seen: ChatEvent[] = [];
    const parser = createEventParser((e) => seen.push(e));
    for (const c of chunks) parser.push(c);
    parser.end();
    return seen;
}

describe('encodeEvent', () => {
    it('emits exactly one newline-terminated line per event', () => {
        const line = encodeEvent({ type: 'text', text: 'hello' });
        expect(line.endsWith('\n')).toBe(true);
        expect(line.split('\n').filter(Boolean)).toHaveLength(1);
    });

    it('escapes newlines inside the payload rather than ending the frame early', () => {
        // Model prose contains newlines constantly. If they leaked into the framing,
        // every paragraph break would look like a new event.
        const line = encodeEvent({ type: 'text', text: 'a\nb' });
        expect(line.split('\n').filter(Boolean)).toHaveLength(1);
        expect(collect([line])).toEqual([{ type: 'text', text: 'a\nb' }]);
    });
});

describe('createEventParser', () => {
    it('reads whole events from a single chunk', () => {
        const chunk = encodeEvent({ type: 'text', text: 'hi' }) + encodeEvent({ type: 'done' });
        expect(collect([chunk])).toEqual([{ type: 'text', text: 'hi' }, { type: 'done' }]);
    });

    it('reassembles an event split across chunk boundaries', () => {
        // The network splits wherever it likes; a frame cut mid-JSON must not be lost.
        const line = encodeEvent({ type: 'text', text: 'split me' });
        const cut = Math.floor(line.length / 2);
        expect(collect([line.slice(0, cut), line.slice(cut)])).toEqual([
            { type: 'text', text: 'split me' },
        ]);
    });

    it('handles a boundary that lands exactly on the newline', () => {
        const line = encodeEvent({ type: 'text', text: 'edge' });
        expect(collect([line.slice(0, -1), '\n'])).toEqual([{ type: 'text', text: 'edge' }]);
    });

    it('flushes a final line that has no trailing newline', () => {
        expect(collect([JSON.stringify({ type: 'done' })])).toEqual([{ type: 'done' }]);
    });

    it('skips a corrupt frame without dropping the ones around it', () => {
        const chunk = [
            encodeEvent({ type: 'text', text: 'before' }),
            '{not json at all}\n',
            encodeEvent({ type: 'text', text: 'after' }),
        ].join('');
        expect(collect([chunk])).toEqual([
            { type: 'text', text: 'before' },
            { type: 'text', text: 'after' },
        ]);
    });

    it('ignores blank lines', () => {
        expect(collect(['\n\n' + encodeEvent({ type: 'done' })])).toEqual([{ type: 'done' }]);
    });

    it('carries tool and citation events through intact', () => {
        const events: ChatEvent[] = [
            { type: 'tool', name: 'showChart', input: { type: 'bar', labels: ['a'], data: [1] } },
            { type: 'citations', sources: [{ id: 'blog:x', title: 'X', url: '/blog/x' }] },
            { type: 'error', message: 'nope' },
        ];
        expect(collect([events.map(encodeEvent).join('')])).toEqual(events);
    });

    it('survives a stream cut off mid-frame', () => {
        // Truncation is what a dropped connection looks like. The completed events
        // before it must still arrive.
        const partial = encodeEvent({ type: 'text', text: 'ok' }) + '{"type":"te';
        expect(collect([partial])).toEqual([{ type: 'text', text: 'ok' }]);
    });
});

describe('readEventStream', () => {
    /**
     * A body that hands over one chunk per `read()`, with a hook that fires after each
     * one. Nothing here waits on the network, so the abort lands at a known point.
     */
    function bodyOf(lines: string[], afterEachRead?: () => void): Response {
        let i = 0;
        const encoder = new TextEncoder();
        const body = {
            getReader: () => ({
                read: async () => {
                    const result = i < lines.length
                        ? { done: false, value: encoder.encode(lines[i++]) }
                        : { done: true, value: undefined };
                    afterEachRead?.();
                    return result;
                },
                cancel: async () => {},
            }),
        };
        return { body } as unknown as Response;
    }

    it('delivers every event and completes', async () => {
        const seen: ChatEvent[] = [];
        await readEventStream(
            bodyOf([encodeEvent({ type: 'text', text: 'hi' }), encodeEvent({ type: 'done' })]),
            (e) => seen.push(e),
        );
        expect(seen).toEqual([{ type: 'text', text: 'hi' }, { type: 'done' }]);
    });

    it('stops delivering events once the signal aborts', async () => {
        // The regression this guards: a reply short enough to already be buffered kept
        // rendering after the stop button was pressed, because aborting the controller
        // only rejects `fetch` while the *request* is still in flight.
        const controller = new AbortController();
        const seen: ChatEvent[] = [];
        const lines = [
            encodeEvent({ type: 'text', text: 'one' }),
            encodeEvent({ type: 'text', text: 'two' }),
            encodeEvent({ type: 'text', text: 'three' }),
        ];

        await expect(
            readEventStream(
                bodyOf(lines, () => { if (seen.length === 1) controller.abort(); }),
                (e) => seen.push(e),
                controller.signal,
            ),
        ).rejects.toMatchObject({ name: 'AbortError' });

        expect(seen).toEqual([{ type: 'text', text: 'one' }]);
    });

    it('throws rather than returning quietly, so a stop is not read as a finished turn', async () => {
        // Callers save the answer to history and speak it aloud on the success path.
        // A silent return would let a half-sentence through both.
        const controller = new AbortController();
        controller.abort();
        await expect(
            readEventStream(bodyOf([encodeEvent({ type: 'done' })]), () => {}, controller.signal),
        ).rejects.toMatchObject({ name: 'AbortError' });
    });
});
