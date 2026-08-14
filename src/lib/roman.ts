/**
 * Roman numerals, for the ledger's folio numbers and entry dates.
 *
 * The convention the page follows: dates and foliation in Roman, sums in Arabic.
 * That is how the books actually look — Italian merchants took up Hindu-Arabic
 * numerals for the arithmetic, because you cannot add in Roman, but kept Roman
 * for dates and folio numbers long afterwards.
 *
 * Lowercase, which is what a scribe would write in a running hand.
 */

const NUMERALS: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'],  [90, 'xc'],  [50, 'l'],  [40, 'xl'],
    [10, 'x'],   [9, 'ix'],   [5, 'v'],   [4, 'iv'],
    [1, 'i']
];

/**
 * Roman numeral for a positive integer. Returns '' for zero, negatives and
 * anything non-finite — there is no Roman zero, and a silent '' beats an
 * exception in a render path.
 */
export function roman(n: number): string {
    if (!Number.isFinite(n) || n < 1) return '';

    let out = '';
    let rest = Math.floor(n);

    for (const [value, numeral] of NUMERALS) {
        while (rest >= value) {
            out += numeral;
            rest -= value;
        }
    }

    return out;
}

/**
 * A timestamp as `xiii · viii · mmxxvi`.
 *
 * Day-month-year, which is the written order in all three of the site's
 * languages. Always pair this with a real localised date for screen readers —
 * read aloud, Roman numerals are gibberish, and `viii · xiii` is ambiguous even
 * on the page.
 */
export function romanDate(timestamp: number): string {
    if (!Number.isFinite(timestamp)) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return [
        roman(date.getDate()),
        roman(date.getMonth() + 1),
        roman(date.getFullYear())
    ].join(' · ');
}
