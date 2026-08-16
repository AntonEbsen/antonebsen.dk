import type { Source } from './corpus';

/**
 * The wire format between /api/chat and the browser.
 *
 * Newline-delimited JSON: one event per line, each a self-contained object. The
 * previous arrangement streamed raw prose and hid control instructions inside it as
 * `<<<TAG>>>` markers, which meant every client re-parsed the model's text and a
 * partially-streamed tag briefly rendered as visible junk. Here, text is text and
 * everything else arrives as its own typed event that cannot be confused with it.
 *
 * NDJSON rather than SSE because both ends are ours, the existing clients already
 * read the body with `getReader()`, and a line of JSON is trivial to inspect in the
 * network tab. The only framing rule is the one below: split on newlines, and hold
 * the trailing fragment until the next chunk completes it.
 */

export type ChatEvent =
    /** Incremental prose. Concatenate in arrival order. */
    | { type: 'text'; text: string }
    /** A tool the browser renders. `input` is validated against the tool's schema. */
    | { type: 'tool'; name: string; input: unknown }
    /** Citations, already resolved server-side into titles and site-relative URLs. */
    | { type: 'citations'; sources: Source[] }
    /**
     * The turn failed. A provider error arrives after the response headers are
     * already sent, so it cannot change the status code — it has to be an event.
     */
    | { type: 'error'; message: string }
    /** The turn finished cleanly. Absence of this means the stream was cut short. */
    | { type: 'done' };

export const NDJSON_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8';

/** Serialise one event as a line. Server side. */
export function encodeEvent(event: ChatEvent): string {
    return JSON.stringify(event) + '\n';
}

/**
 * Incremental NDJSON reader.
 *
 * A network chunk can split a line anywhere, so the tail is buffered until a
 * newline completes it. Malformed lines are skipped rather than thrown: a single
 * corrupt frame should not take down a conversation that is otherwise fine.
 */
export function createEventParser(onEvent: (event: ChatEvent) => void) {
    let buffer = '';

    return {
        /** Feed a decoded chunk. */
        push(chunk: string): void {
            buffer += chunk;
            const lines = buffer.split('\n');
            // The last element is either an incomplete line or '' — keep it for next time.
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    onEvent(JSON.parse(line) as ChatEvent);
                } catch {
                    // Truncated or corrupt frame; the rest of the stream is still good.
                }
            }
        },
        /** Call once the body ends, to flush a final line with no trailing newline. */
        end(): void {
            const line = buffer.trim();
            buffer = '';
            if (!line) return;
            try {
                onEvent(JSON.parse(line) as ChatEvent);
            } catch {
                // Stream ended mid-frame — nothing recoverable.
            }
        },
    };
}

/** Thrown by `readEventStream` when the caller's signal aborts. */
function abortError(): Error {
    // Matching the name `fetch` itself uses means callers need one check, not two.
    const err = new Error('The stream was aborted.');
    err.name = 'AbortError';
    return err;
}

/**
 * Read a fetch Response body as chat events. Shared by every client so the framing
 * rules live in exactly one place.
 *
 * Pass `signal` to make a stop button work. Two things are needed and neither is
 * obvious:
 *
 *  - Aborting the controller rejects `fetch` only while the *request* is in flight.
 *    Once the response headers have arrived — which for a streamed reply is almost
 *    immediately — the body is a separate stream. Worse, if the reply was short
 *    enough to have already arrived, it sits buffered in memory and abort has
 *    nothing left to cancel, so the remaining chunks render anyway. Cancelling the
 *    reader *and* checking the flag before each push is what actually stops it.
 *  - Returning quietly on abort would leave callers unable to tell a stopped stream
 *    from a finished one, so they would save the half-answer to history and speak
 *    it aloud. Throwing puts a stop on the same path as any other interruption.
 */
export async function readEventStream(
    response: Response,
    onEvent: (event: ChatEvent) => void,
    signal?: AbortSignal,
): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    const parser = createEventParser(onEvent);

    const onAbort = () => { void reader.cancel().catch(() => {}); };
    if (signal?.aborted) throw abortError();
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (signal?.aborted) throw abortError();
            if (done) break;
            parser.push(decoder.decode(value, { stream: true }));
        }
        parser.end();
    } finally {
        signal?.removeEventListener('abort', onAbort);
    }
}
