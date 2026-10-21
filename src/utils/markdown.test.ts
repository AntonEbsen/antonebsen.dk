import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('Markdown math after the renderer upgrade', () => {
  it('renders inline and display equations with KaTeX', () => {
    const html = renderMarkdown('An estimate $x^2$ and a model:\n\n$$y = \\beta x + \\epsilon$$');
    expect(html).toContain('class="katex"');
    expect(html).toContain('class="katex-display"');
    expect(html).not.toContain('katex-error');
    expect(html).toContain('An estimate');
  });

  it('keeps ordinary Markdown and currency text readable', () => {
    const html = renderMarkdown('**Research** costs $ 10.');
    expect(html).toContain('<strong>Research</strong>');
    expect(html).toContain('$ 10.');
    expect(html).not.toContain('class="katex"');
  });
});
