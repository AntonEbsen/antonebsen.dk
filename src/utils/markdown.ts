import { marked } from 'marked';
import katex from 'katex';

export function renderMarkdown(content: string): string {
    // 1. Render Display Math ($$ ... $$)
    let rendered = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
        try {
            return katex.renderToString(equation, { displayMode: true, throwOnError: false });
        } catch (e) {
            return equation;
        }
    });

    // 2. Render Inline Math ($ ... $)
    // Be careful not to match simple currency symbols. We require immediate non-space after $.
    // Regex: \$([^\s$][^$]*?)\$ 
    rendered = rendered.replace(/\$([^\s$][^$]*?)\$/g, (_, equation) => {
        try {
            return katex.renderToString(equation, { displayMode: false, throwOnError: false });
        } catch (e) {
            return equation;
        }
    });

    // 3. Render Markdown
    return marked.parse(rendered) as string;
}
