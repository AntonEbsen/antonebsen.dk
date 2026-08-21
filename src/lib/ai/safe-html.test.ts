import { describe, it, expect } from 'vitest';
import { escapeHtml, isAllowedNavPath, NAV_ALLOWLIST, renderModelText } from './safe-html';

describe('escapeHtml', () => {
    it('neutralises an event-handler injection', () => {
        const out = escapeHtml('<img src=x onerror=alert(1)>');
        expect(out).toBe('&lt;img src=x onerror=alert(1)&gt;');
        expect(out).not.toContain('<img');
    });

    it('escapes quotes, so model text cannot break out of an attribute', () => {
        expect(escapeHtml(`" onmouseover="alert(1)`)).toBe(
            '&quot; onmouseover=&quot;alert(1)',
        );
        expect(escapeHtml("' onfocus='x")).toBe('&#39; onfocus=&#39;x');
    });

    it('escapes the ampersand first, so entities are not double-decoded', () => {
        expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
    });

    it('closes the script-tag case', () => {
        expect(escapeHtml('</script><script>alert(1)</script>')).not.toContain('<script');
    });

    it('leaves ordinary prose untouched', () => {
        expect(escapeHtml('Anton studied economics in Aarhus.')).toBe(
            'Anton studied economics in Aarhus.',
        );
    });

    it('handles null and undefined without throwing', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });
});

describe('isAllowedNavPath', () => {
    it('accepts every path in the allowlist', () => {
        for (const p of NAV_ALLOWLIST) {
            expect(isAllowedNavPath(p)).toBe(true);
        }
    });

    it('covers all three language trees', () => {
        expect(isAllowedNavPath('/blog')).toBe(true);
        expect(isAllowedNavPath('/en/blog')).toBe(true);
        expect(isAllowedNavPath('/de/blog')).toBe(true);
        expect(isAllowedNavPath('/en')).toBe(true);
    });

    it('rejects redirects to another origin', () => {
        expect(isAllowedNavPath('https://evil.com')).toBe(false);
        expect(isAllowedNavPath('//evil.com')).toBe(false);
        expect(isAllowedNavPath('http://evil.com/blog')).toBe(false);
    });

    it('rejects script URLs', () => {
        expect(isAllowedNavPath('javascript:alert(1)')).toBe(false);
        expect(isAllowedNavPath('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('rejects traversal and anything merely prefixed with an allowed path', () => {
        expect(isAllowedNavPath('/blog/../admin')).toBe(false);
        expect(isAllowedNavPath('/blog?next=//evil.com')).toBe(false);
        expect(isAllowedNavPath('/cv-export')).toBe(false);
        expect(isAllowedNavPath('/admin')).toBe(false);
    });

    it('rejects non-strings', () => {
        expect(isAllowedNavPath(undefined)).toBe(false);
        expect(isAllowedNavPath(null)).toBe(false);
        expect(isAllowedNavPath(['/blog'])).toBe(false);
    });
});

describe('renderModelText', () => {
    it('neutralises markup in the model reply', () => {
        const out = renderModelText('Here you go: <img src=x onerror=alert(1)>');
        expect(out).not.toContain('<img');
        expect(out).toContain('&lt;img');
    });

    it('does not let the model close our tags', () => {
        const out = renderModelText('</span><script>alert(1)</script>');
        expect(out).not.toContain('<script');
        expect(out).not.toContain('</span>');
    });

    it('renders a leftover control tag as inert text rather than acting on it', () => {
        // The DSL is gone — charts and navigation are stream events now. If an old
        // prompt or a confused model emits the old syntax, it must show up as
        // characters on the page, never as behaviour.
        const out = renderModelText('<<<NAVIGATE: https://evil.com >>>');
        expect(out).not.toContain('<<<');
        expect(out).toContain('&lt;&lt;&lt;NAVIGATE');
    });

    it('applies bold and honours the caller line break inside a paragraph', () => {
        expect(renderModelText('**hi**\nthere', { lineBreak: '<br>' })).toBe(
            '<p><strong>hi</strong><br>there</p>',
        );
        expect(renderModelText('a\nb')).toBe('<p>a<br/>b</p>');
    });

    it('renders headings offset below the page own h1 and h2', () => {
        // A long answer opens with `## Uddannelse`. Emitting an h1 inside a page that
        // already has one breaks the outline; `#` starts at h3.
        expect(renderModelText('# Title')).toBe('<h3>Title</h3>');
        expect(renderModelText('## Sub')).toBe('<h4>Sub</h4>');
        // No space after the hashes is not a heading, so a lone `#` stays prose.
        expect(renderModelText('#notaheading')).toBe('<p>#notaheading</p>');
    });

    it('renders both bullet styles and ordered lists', () => {
        expect(renderModelText('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
        expect(renderModelText('* one')).toBe('<ul><li>one</li></ul>');
        expect(renderModelText('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
    });

    it('separates blocks rather than running them together', () => {
        expect(renderModelText('Intro\n\n- a\n\nAfter')).toBe(
            '<p>Intro</p><ul><li>a</li></ul><p>After</p>',
        );
        // Prose straight after a list starts a paragraph, not another item.
        expect(renderModelText('- a\nAfter')).toBe('<ul><li>a</li></ul><p>After</p>');
    });

    it('renders inline code', () => {
        expect(renderModelText('use `npm run dev`')).toBe(
            '<p>use <code>npm run dev</code></p>',
        );
    });

    it('leaves markdown links as text, never as an href', () => {
        // The one markdown feature deliberately unsupported: a rendered link would put
        // a destination under the model's control. citeSources resolves ids to URLs
        // server-side precisely so that cannot happen.
        const out = renderModelText('see [my site](https://evil.com)');
        expect(out).not.toContain('<a');
        expect(out).not.toContain('href');
        expect(out).toContain('[my site]');
    });

    it('still escapes before any block or inline transform runs', () => {
        // The ordering property, asserted through the new code paths rather than only
        // the old one: a payload inside a heading, a list item and a bold run.
        for (const input of [
            '# <img src=x onerror=alert(1)>',
            '- <script>alert(1)</script>',
            '**<svg onload=alert(1)>**',
            '`<iframe src=javascript:alert(1)>`',
        ]) {
            const out = renderModelText(input);
            expect(out, input).not.toMatch(/<(img|script|svg|iframe)/);
            expect(out, input).toContain('&lt;');
        }
    });

    it('handles empty and nullish input', () => {
        expect(renderModelText('')).toBe('');
        expect(renderModelText(null)).toBe('');
        expect(renderModelText(undefined)).toBe('');
    });
});

describe('renderModelText fenced blocks', () => {
    const fence = '```';

    it('renders a fenced block as pre/code with its language', () => {
        const out = renderModelText(`${fence}ts\nconst a = 1;\n${fence}`);
        expect(out).toBe('<pre><code class="language-ts">const a = 1;</code></pre>');
    });

    it('renders a fence with no language', () => {
        expect(renderModelText(`${fence}\nplain\n${fence}`)).toBe('<pre><code>plain</code></pre>');
    });

    it('renders a mermaid fence as the div the diagram engine looks for', () => {
        const out = renderModelText(`${fence}mermaid\ngraph TD;\nA-->B;\n${fence}`);
        expect(out).toMatch(/^<div class="mermaid">/);

        // The arrow is escaped in the markup — and must be, since this is the same
        // string that would otherwise be a tag. What matters is what mermaid.run()
        // reads, which is textContent, and the browser decodes entities on the way
        // out. So assert the round trip rather than the literal markup.
        const textContent = out
            .replace(/<[^>]+>/g, '')
            .replace(/&gt;/g, '>')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
        expect(textContent).toBe('graph TD;\nA-->B;');
    });

    it('does not read the block contents as prose', () => {
        // A '#' or '- ' inside code is code, not a heading or a bullet.
        const out = renderModelText(`${fence}sh\n# a comment\n- not a bullet\n**not bold**\n${fence}`);
        expect(out).not.toContain('<h3');
        expect(out).not.toContain('<li>');
        expect(out).not.toContain('<strong>');
        expect(out).toContain('# a comment');
    });

    it('still escapes a payload inside a fence', () => {
        for (const lang of ['js', 'mermaid']) {
            const out = renderModelText(`${fence}${lang}\n<img src=x onerror=alert(1)>\n${fence}`);
            expect(out, lang).not.toContain('<img');
            expect(out, lang).toContain('&lt;img');
        }
    });

    it('renders an unterminated fence rather than swallowing the rest', () => {
        // What a stopped stream leaves: an opening fence and no closer.
        const out = renderModelText(`intro\n${fence}js\nconst a = 1;`);
        expect(out).toContain('<p>intro</p>');
        expect(out).toContain('const a = 1;');
    });

    it('keeps prose on both sides of a block', () => {
        const out = renderModelText(`before\n\n${fence}\ncode\n${fence}\n\nafter`);
        expect(out).toBe('<p>before</p><pre><code>code</code></pre><p>after</p>');
    });

    it('cannot carry a crafted language token into the class attribute', () => {
        // The language is interpolated into an attribute, so its charset is restricted
        // to word characters. A token with a quote in it is not a fence opener at all
        // and falls through to prose — where the quote is escaped. The payload is still
        // *visible*, as inert text; what must not happen is it becoming an attribute.
        const out = renderModelText(`${fence}js" onload="alert(1)\ncode\n${fence}`);
        expect(out).not.toMatch(/class="language-[^"]*"[^>]*onload/);
        expect(out).not.toContain('onload="');
        expect(out).toContain('&quot;');
    });
});

describe('renderModelText — citation markers', () => {
    it('turns [^id] into an empty superscript carrying the id', () => {
        const html = renderModelText('Han skrev om Taylor-reglen[^blog:taylor].');
        expect(html).toContain('<sup class="citation-ref" data-source-id="blog:taylor"></sup>');
    });

    it('never emits an href from the marker', () => {
        // The id is a lookup key. The whole reason citations resolve server-side is that
        // no model-supplied string may become a URL, and a marker is model-supplied.
        const html = renderModelText('x[^blog:taylor] y[^cv:experience:2]');
        expect(html).not.toMatch(/href/i);
    });

    it('leaves a marker whose id contains markup characters as literal text', () => {
        // The charset excludes everything escapeHtml rewrites, so this does not match the
        // marker pattern at all — it stays escaped prose instead of being interpolated
        // into an attribute where the quote could close it.
        const html = renderModelText('claim[^a"onmouseover=alert(1) b]');
        // It stays inert prose: no marker was produced, and the quote that would have
        // closed the attribute is escaped, so the payload is text and not markup.
        expect(html).not.toContain('citation-ref');
        expect(html).not.toContain('data-source-id');
        expect(html).toContain('&quot;');
        expect(html).toBe('<p>claim[^a&quot;onmouseover=alert(1) b]</p>');
    });

    it('marks inside headings and list items, not only paragraphs', () => {
        const html = renderModelText('## Uddannelse[^cv:education:0]\n- punkt[^blog:x]');
        expect(html).toContain('<h4>');
        expect(html.match(/citation-ref/g)?.length).toBe(2);
    });

    it('leaves a marker inside a fence alone', () => {
        // A fence is consumed whole before inline marks run, so code showing the syntax
        // is not silently turned into a footnote.
        const html = renderModelText('```\nfoo[^bar:baz]\n```');
        expect(html).toContain('foo[^bar:baz]');
        expect(html).not.toContain('citation-ref');
    });

    it('strips markers for a surface that renders no apparatus', () => {
        // The command palette shows prose only. A number there could never be filled in,
        // and would be a footnote reference to a footnote that is not on the page.
        const html = renderModelText('Han skrev om det[^blog:taylor].', { citations: 'strip' });
        expect(html).not.toContain('citation-ref');
        expect(html).not.toContain('blog:taylor');
        expect(html).toContain('Han skrev om det.');
    });

    it('eats the space the model often leaves before the marker', () => {
        // A footnote marker hugs the word it belongs to. The model writes both forms,
        // and which one it picked should not decide the typography.
        expect(renderModelText('systemer [^influence:piketty].'))
            .toBe('<p>systemer<sup class="citation-ref" data-source-id="influence:piketty"></sup>.</p>');
    });

    it('does not mistake ordinary brackets for markers', () => {
        const html = renderModelText('[se her] og [^ ikke et id]');
        expect(html).not.toContain('citation-ref');
    });
});
