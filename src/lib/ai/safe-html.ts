/**
 * Guards for rendering model output.
 *
 * The chat clients build HTML strings and assign them to innerHTML. Everything the
 * model emits is untrusted — it is steered by visitor text, by uploaded PDFs, and by
 * the corpus itself — so it has to be escaped *before* the markdown-ish transforms
 * run. Escape first, add markup second, and the only tags left in the string are the
 * ones this code authored.
 *
 * Escaping is done with string replacement rather than the `div.textContent` trick so
 * the same function is usable server-side and in a plain vitest run.
 */

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeHtml(input: unknown): string {
    return String(input ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * Pages the assistant may navigate a visitor to.
 *
 * This list used to live only in the system prompt, as a sentence asking the model to
 * stick to it. That is not an enforcement mechanism: the client assigned whatever came
 * back to `window.location.href`, so a redirect to an arbitrary origin was one
 * hallucinated — or injected — token away. It is now also the `enum` of the
 * `navigateTo` tool's schema, so the API rejects an off-list path before the browser
 * ever sees it; this stays as the check at the point of use.
 *
 * Each base path exists in all three language trees, so the Danish root, `/en/…` and
 * `/de/…` are all admissible and a visitor is never bounced out of their language.
 */
const NAV_BASES = ['/', '/about', '/blog', '/portfolio', '/cv', '/contact'] as const;

export const NAV_ALLOWLIST: readonly string[] = Object.freeze([
    ...NAV_BASES,
    ...['en', 'de'].flatMap((lang) =>
        NAV_BASES.map((p) => (p === '/' ? `/${lang}` : `/${lang}${p}`)),
    ),
]);

/**
 * Exact membership only. Anything else — absolute URLs, protocol-relative `//host`,
 * `javascript:`, traversal, query strings — fails, because none of them are equal to
 * a string in the list.
 */
export function isAllowedNavPath(path: unknown): path is string {
    return typeof path === 'string' && NAV_ALLOWLIST.includes(path);
}

export interface RenderModelTextOptions {
    /** `<br/>` or `<br>`, to preserve each caller's existing output byte-for-byte. */
    lineBreak?: string;
    /** Render `* item` lines as list items. */
    bullets?: boolean;
}

/**
 * Turn model prose into HTML that is safe to assign to innerHTML.
 *
 * This used to also strip a `<<<TAG>>>` control DSL out of the prose, because charts,
 * navigation and citations were smuggled through the text channel and every client
 * regex'd them back out. They are typed stream events now (see protocol.ts), so this
 * handles prose and nothing else — which is the point: text is text, and anything
 * that isn't text can no longer arrive disguised as it.
 */
export function renderModelText(raw: unknown, opts: RenderModelTextOptions = {}): string {
    const { lineBreak = '<br/>', bullets = false } = opts;

    // Nothing below this line trusts the model.
    let t = escapeHtml(raw);

    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (bullets) {
        t = t.replace(/^\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>');
    }
    return t.replace(/\n/g, lineBreak);
}
