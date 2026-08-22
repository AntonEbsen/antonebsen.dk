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
    /** `<br/>` or `<br>`, for soft breaks inside a paragraph. */
    lineBreak?: string;
    /**
     * What to do with `[^id]` citation markers.
     *
     * `'mark'` emits a superscript for the client to number against the resolved
     * sources. `'strip'` removes them, and is for a surface that renders no apparatus —
     * the command palette shows prose only, so a marker there could never be given a
     * number and would be a footnote reference to a footnote that is not on the page.
     */
    citations?: 'mark' | 'strip';
}

/**
 * Inline marks, applied to text that has already been escaped.
 *
 * Deliberately no link syntax. `[text](url)` would put an href under the model's
 * control, which is the exact hole `citeSources` exists to avoid — it resolves ids to
 * URLs server-side so a link can only ever point somewhere the corpus knows about. A
 * markdown link in an answer stays visible as literal text, which is the safe failure.
 */
function inlineMarks(text: string, citations: 'mark' | 'strip'): string {
    return text
        // Bold before anything else, so its inner asterisks are consumed here and
        // cannot be re-read as emphasis or as a bullet.
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+?)`/g, '<code>$1</code>')
        .replace(
            CITATION_MARKER,
            citations === 'strip' ? '' : '<sup class="citation-ref" data-source-id="$1"></sup>',
        );
}

/**
 * `[^blog:some-post]` — the model marking which source a claim rests on.
 *
 * The id, not a number. Asking the model to write `[1]` would require it to keep its
 * own numbering in step with a `citeSources` call it makes later, which it will
 * eventually get wrong; ids are stable and already the tool's vocabulary, so the
 * ordinal is ours to assign. It is the same reasoning that keeps URLs server-resolved.
 *
 * Any space before it is eaten with it. A footnote marker hugs the word it belongs
 * to; the model writes `systemer [^influence:piketty].` about as often as it writes
 * the tight form, and which one it picked should not decide the typography.
 *
 * The charset is the one corpus ids actually use — `blog:slug`, `cv:experience:0`,
 * `video:slug` — and deliberately excludes every character `escapeHtml` rewrites. So a
 * marker containing a quote or an angle bracket does not match at all and survives as
 * literal text, rather than matching and being interpolated into an attribute. The id
 * is a lookup key on the client and never becomes an href.
 */
const CITATION_MARKER = /[ \t]*\[\^([A-Za-z0-9:@._-]+)\]/g;

/**
 * Turn model prose into HTML that is safe to assign to innerHTML.
 *
 * This used to also strip a `<<<TAG>>>` control DSL out of the prose, because charts,
 * navigation and citations were smuggled through the text channel and every client
 * regex'd them back out. They are typed stream events now (see protocol.ts), so this
 * handles prose and nothing else — which is the point: text is text, and anything
 * that isn't text can no longer arrive disguised as it.
 *
 * It now renders blocks, not just bold. The model writes ordinary markdown — a long
 * answer opens with `## Uddannelse` and lists with `- ` — and only `**bold**` was ever
 * converted, so every heading and bullet reached the visitor as a literal `#` or `-`
 * in the middle of the prose. Structure is also the thing that makes an answer
 * skimmable, and the assistant was emitting it all along.
 *
 * The security property is unchanged and is the reason the order below matters:
 * escaping happens once, first, against the raw string. Every transform after it wraps
 * already-escaped text in tags this module authored, so no model byte can become
 * markup. Nothing here re-introduces unescaped input.
 */
export function renderModelText(raw: unknown, opts: RenderModelTextOptions = {}): string {
    const { lineBreak = '<br/>', citations = 'mark' } = opts;
    const marks = (t: string) => inlineMarks(t, citations);

    // Nothing below this line trusts the model.
    const escaped = escapeHtml(raw);

    const out: string[] = [];
    let paragraph: string[] = [];
    let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;

    const flushParagraph = () => {
        if (!paragraph.length) return;
        out.push(`<p>${marks(paragraph.join(lineBreak))}</p>`);
        paragraph = [];
    };
    const flushList = () => {
        if (!list) return;
        const items = list.items.map((i) => `<li>${marks(i)}</li>`).join('');
        out.push(`<${list.tag}>${items}</${list.tag}>`);
        list = null;
    };
    const flush = () => {
        flushParagraph();
        flushList();
    };

    const openList = (tag: 'ul' | 'ol') => {
        if (list?.tag !== tag) {
            flushList();
            list = { tag, items: [] };
        }
        return list!;
    };

    /*
     * A fence is consumed whole, before the line walker below ever sees its contents:
     * code is not prose, and must not be read as headings, bullets or emphasis. Without
     * this the assistant's code blocks arrived as literal fence lines with the code as
     * paragraphs, and the Reviewer's mermaid diagrams could not survive the move to
     * this renderer at all.
     */
    let fenceLang: string | null = null;
    let fenceLines: string[] = [];

    const closeFence = () => {
        const body = fenceLines.join('\n');
        fenceLines = [];
        // mermaid reads textContent, which the browser entity-decodes back to the
        // original source — so escaping upstream is safe and the diagram still parses.
        if (fenceLang === 'mermaid') {
            out.push(`<div class="mermaid">${body}</div>`);
        } else {
            const cls = fenceLang ? ` class="language-${fenceLang}"` : '';
            out.push(`<pre><code${cls}>${body}</code></pre>`);
        }
        fenceLang = null;
    };

    for (const line of escaped.split('\n')) {
        const fenceEdge = /^\s*`{3,}\s*([A-Za-z0-9_+-]*)\s*$/.exec(line);
        if (fenceEdge) {
            if (fenceLang === null) {
                flush();
                fenceLang = fenceEdge[1] || '';
            } else {
                closeFence();
            }
            continue;
        }
        if (fenceLang !== null) {
            fenceLines.push(line);
            continue;
        }

        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            flush();
            // Offset by two: an answer sits inside a page that already owns h1 and h2,
            // so the model's top-level `#` becomes an h3 rather than a second h1.
            const level = Math.min(6, heading[1].length + 2);
            out.push(`<h${level}>${marks(heading[2])}</h${level}>`);
            continue;
        }

        const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
        if (bullet) {
            flushParagraph();
            openList('ul').items.push(bullet[1]);
            continue;
        }

        const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
        if (ordered) {
            flushParagraph();
            openList('ol').items.push(ordered[1]);
            continue;
        }

        if (!line.trim()) {
            flush();
            continue;
        }

        // Prose after a list starts a new paragraph rather than joining the last item.
        flushList();
        paragraph.push(line);
    }

    // A fence left open by a stopped or truncated stream still renders, rather than
    // silently swallowing every line that followed it.
    if (fenceLang !== null) closeFence();
    flush();
    return out.join('');
}
