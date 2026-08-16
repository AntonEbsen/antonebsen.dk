/**
 * One appearance for the assistant, in both places it appears.
 *
 * The widget and the full-page chat each carried their own copy of these class strings.
 * They were structurally identical and differed only in colour — the widget on
 * `accent`, the full-page chat still on the `purple-*` it was built with before the
 * site was rethemed to stone, terracotta and moss. Two copies is how that happened: the
 * retheme swept the templates, and the copy hidden inside a page script was not a
 * template. Sharing them is what stops it happening again.
 */

/** Classes handed to `createChatRenderers`. */
export const CHAT_THEME = {
    chartBox: 'mt-4 p-4 bg-card/60 rounded-plate border border-rule',
    chartCaption: 'text-xs text-muted mb-2 font-medium',
    nav: 'flex items-center gap-2 text-sm text-accent mt-3 font-bold',
    chip:
        'text-sm bg-accent/10 hover:bg-accent hover:text-bg text-accent border border-accent/20 ' +
        'rounded-control px-4 py-2 transition-colors duration-base',
    quizBox: 'mt-4 p-4 bg-accent/10 border border-accent/30 rounded-plate',
    quizTitle: 'font-bold text-accent',
    quizBody: 'text-sm text-dim',
    // The apparatus under an answer. Rule first, then a small-caps label, then the
    // sources themselves — the register the rest of the site sets for anything
    // citational.
    citationRow: 'flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-rule',
    citationLabel: 'text-[10px] uppercase tracking-[0.14em] text-muted',
    citationPill:
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-control bg-accent/10 ' +
        'border border-accent/20 text-[11px] text-accent hover:bg-accent hover:text-bg transition-colors',
} as const;

/** Classes handed to `createMessageActions`. */
export const CHAT_ACTION_THEME = {
    row: 'flex justify-end items-center gap-1 mt-2',
    button:
        'pointer-events-auto text-muted hover:text-accent transition-colors duration-base ' +
        'w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent/10',
} as const;

/**
 * Alpha steps for the chart ramp.
 *
 * Two hues alternating before either repeats, so a two- or three-series chart — which
 * is nearly all of them — gets maximum separation from the palette's own opposition of
 * terracotta and moss. Only once both are spent does the ramp step down in weight.
 */
const CHART_ALPHAS = [0.85, 0.6, 0.4, 0.25] as const;

const ACCENT_FALLBACK = '212 121 79';
const ACCENT_2_FALLBACK = '111 158 123';

/**
 * A categorical chart ramp built from the two site accents.
 *
 * Chart.js's stock rainbow — pink, blue, yellow, teal, purple — was hardcoded here, so
 * every chart the assistant drew arrived in five colours the site does not own, in the
 * one place it is trying to look considered. `theme.spec.ts` already asserts the
 * convention this follows: economics is terracotta, hiking is moss.
 *
 * Takes channel triplets (`"212 121 79"`) rather than hex so it can be fed straight
 * from the `--*-rgb` custom properties, and stays a pure function so the ramp is
 * testable without a DOM.
 */
export function chartPalette(
    accentRgb: string = ACCENT_FALLBACK,
    accent2Rgb: string = ACCENT_2_FALLBACK,
): string[] {
    const channels = (raw: string, fallback: string) => {
        const parts = raw.trim().split(/[\s,]+/).filter(Boolean);
        return parts.length === 3 ? parts.join(', ') : fallback.split(' ').join(', ');
    };
    const a = channels(accentRgb, ACCENT_FALLBACK);
    const b = channels(accent2Rgb, ACCENT_2_FALLBACK);

    return CHART_ALPHAS.flatMap((alpha) => [`rgba(${a}, ${alpha})`, `rgba(${b}, ${alpha})`]);
}

/**
 * The ramp for the current document, read from the tokens rather than duplicated.
 *
 * Falls back to the committed values when there is no DOM or the properties are
 * missing, so a chart is never colourless.
 */
export function readChartPalette(): string[] {
    if (typeof document === 'undefined') return chartPalette();
    const style = getComputedStyle(document.documentElement);
    return chartPalette(
        style.getPropertyValue('--accent-rgb'),
        style.getPropertyValue('--accent-2-rgb'),
    );
}

/**
 * The chart's furniture — ticks, gridlines, legend — which was hardcoded to a stack of
 * `rgba(255, 255, 255, …)`. Plain white is not a colour this site uses anywhere: the
 * text token is warm (`#E8E4DC`) and the hairlines are derived from it, so white read
 * as slightly cold against everything around it.
 */
export function readChartChrome(): { text: string; grid: string } {
    const fallback = { text: '#B8BCB5', grid: 'rgba(232, 228, 220, 0.08)' };
    if (typeof document === 'undefined') return fallback;
    const style = getComputedStyle(document.documentElement);
    return {
        text: style.getPropertyValue('--text-dim').trim() || fallback.text,
        grid: style.getPropertyValue('--rule').trim() || fallback.grid,
    };
}
