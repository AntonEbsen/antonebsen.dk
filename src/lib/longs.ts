/**
 * The long s (ſ), for scriptorium mode.
 *
 * Used in print across English, Danish and German until roughly 1800 — Denmark
 * kept setting type in Fraktur until the 1870s, so this is the letterform of the
 * primary sources, not an ornament.
 *
 * The historical convention has a fair number of edge rules (short s before an
 * apostrophe, before a hyphen at a line break, in some compounds). This applies
 * the one rule that carries almost all of the visual effect and is unambiguous:
 *
 *   a lowercase s becomes ſ when another letter follows it.
 *
 * Which gives the two cases a reader would notice if they were wrong:
 *   his      → his        (word-final s stays short)
 *   passage  → paſſage    (both become long)
 *   Congress → Congreſs   (long then short, exactly as printed)
 *   s'il     → s'il       (apostrophe is not a letter, so the s stays short)
 *
 * Uppercase S is never touched — there is no long capital.
 */

/** Unicode-aware: æ ø å ä ö ü ß all count as letters, so Danish and German work. */
const LONG_S = /s(?=\p{L})/gu;

export function toLongS(text: string): string {
    return text.replace(LONG_S, 'ſ');
}

/**
 * Elements whose text must never be rewritten.
 *
 * Navigation and controls stay in Latin script so the mode is always escapable,
 * and anything carrying a `data-ledger-*` attribute is off limits because the
 * ledger's own client script reads text back out of those nodes — a stray ſ in
 * a mark total would be parsed as NaN.
 */
export const SCRIPTORIUM_SKIP = [
    'nav', 'footer', 'button', 'input', 'textarea', 'select', 'option', 'label',
    'code', 'pre', 'kbd', 'samp', 'script', 'style', 'time'
];

/** True when this node sits inside something that must be left alone. */
export function isProtected(node: Node): boolean {
    let el: HTMLElement | null =
        node.nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement)
            : node.parentElement;

    while (el) {
        if (SCRIPTORIUM_SKIP.includes(el.tagName.toLowerCase())) return true;
        if (el.isContentEditable) return true;
        // Any data-ledger-* hook, plus the toggle bar itself.
        for (const name of el.getAttributeNames()) {
            if (name.startsWith('data-ledger') || name === 'data-scriptorium-exempt') return true;
        }
        el = el.parentElement;
    }

    return false;
}
