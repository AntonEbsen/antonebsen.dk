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

    it('applies bold and honours the caller line break', () => {
        expect(renderModelText('**hi**\nthere', { lineBreak: '<br>' })).toBe(
            '<strong>hi</strong><br>there',
        );
        expect(renderModelText('a\nb')).toBe('a<br/>b');
    });

    it('renders bullets only when asked', () => {
        expect(renderModelText('* one', { bullets: true })).toContain('<li');
        expect(renderModelText('* one')).not.toContain('<li');
    });

    it('handles empty and nullish input', () => {
        expect(renderModelText('')).toBe('');
        expect(renderModelText(null)).toBe('');
        expect(renderModelText(undefined)).toBe('');
    });
});
