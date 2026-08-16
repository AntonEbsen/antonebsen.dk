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
