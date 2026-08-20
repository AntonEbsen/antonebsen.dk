/**
 * Turning the stored transcript into what the API can be sent.
 *
 * Both chat clients kept a transcript in localStorage, replayed it on load, and then
 * posted only the newest question — `/api/chat` accepts `messages[]` for a real
 * conversation and `message` for what its own schema comment calls "legacy single-turn
 * callers", and both clients used the legacy field. So the assistant answered every
 * question having never seen the one before it, while the screen showed a conversation.
 * The quiz depended on that history existing and therefore could not work at all.
 *
 * Three rules are enforced here rather than at the call sites, because each of them
 * fails as an opaque 400 halfway through a session rather than as anything readable:
 *
 *  - the stored role is `'ai'`, the API's is `'assistant'`;
 *  - the API requires roles to alternate, and a stopped answer leaves two user turns
 *    in a row;
 *  - a window taken blindly can open on an assistant turn, handing the model an answer
 *    with no question attached.
 */

/** A turn as the clients store it. Fields are optional: this is parsed from storage. */
export interface StoredTurn {
    text?: unknown;
    role?: unknown;
}

export interface ApiMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * How many turns travel with each request — five exchanges.
 *
 * The corpus is the expensive part of a request and sits behind a cache breakpoint, so
 * a handful of short turns costs very little against it. The window exists so that
 * cost stays flat: without one, every message in a long session would pay for the whole
 * session, and the monthly ceiling is what would absorb that.
 */
export const HISTORY_WINDOW = 10;

/** The stored role vocabulary, mapped to the API's. Anything else is not a turn. */
function apiRole(role: unknown): 'user' | 'assistant' | null {
    if (role === 'user') return 'user';
    if (role === 'ai' || role === 'assistant') return 'assistant';
    return null;
}

export function toApiMessages(
    stored: unknown,
    limit: number = HISTORY_WINDOW,
): ApiMessage[] {
    if (!Array.isArray(stored)) return [];

    // 1. Normalise, dropping anything that is not a turn with something in it. An
    //    empty assistant turn is what pressing stop before the first token leaves.
    const turns: ApiMessage[] = [];
    for (const entry of stored as StoredTurn[]) {
        const role = apiRole(entry?.role);
        if (!role) continue;
        const content = typeof entry?.text === 'string' ? entry.text.trim() : '';
        if (!content) continue;
        turns.push({ role, content });
    }

    // 2. Merge runs of the same role. Two user turns in a row is not hypothetical: it
    //    is exactly what a stopped answer leaves behind, and the API rejects it.
    //    Merging rather than discarding keeps the question that went unanswered.
    const alternating: ApiMessage[] = [];
    for (const turn of turns) {
        const last = alternating[alternating.length - 1];
        if (last && last.role === turn.role) {
            last.content += `\n\n${turn.content}`;
        } else {
            alternating.push({ ...turn });
        }
    }

    // 3. Window from the end, then drop a leading assistant turn. Order matters:
    //    trimming before windowing would leave the window one short.
    const windowed = limit > 0 ? alternating.slice(-limit) : [];
    if (windowed[0]?.role === 'assistant') windowed.shift();

    return windowed;
}
