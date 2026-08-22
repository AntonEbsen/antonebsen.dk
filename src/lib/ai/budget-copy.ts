import type { BudgetScope } from './budget';

/**
 * What a visitor reads when the assistant has spent its allowance.
 *
 * `budget.ts` returns an English `message` and a `scope`; this turns the scope into
 * something the visitor can actually read. The translation lives here rather than in
 * the guard so that budget.ts stays free of i18n — it is called from routes that know
 * the language and from tests that do not.
 *
 * This mattered less when the ceiling was 450 messages a month and nobody was ever
 * going to see it. At the 80 the cost measurement justified, a visitor reading this is
 * a plausible Tuesday — and on a site whose default language is Danish, the first thing
 * they read should not be in English.
 */
const COPY: Record<string, Record<BudgetScope, string>> = {
    da: {
        month: 'Assistenten har brugt sit budget for denne måned. Den er tilbage næste måned.',
        day: 'Assistenten har brugt sit budget for i dag. Prøv igen i morgen.',
        ip: 'Du har nået dagens grænse for assistenten. Prøv igen i morgen.',
        unavailable: 'Assistenten er ikke tilgængelig lige nu.',
    },
    en: {
        month: 'The assistant has reached its budget for this month. It will be back next month.',
        day: 'The assistant has reached its budget for today. Try again tomorrow.',
        ip: "You've reached today's limit for the assistant. Try again tomorrow.",
        unavailable: 'The assistant is unavailable right now.',
    },
    de: {
        month: 'Der Assistent hat sein Budget für diesen Monat aufgebraucht. Nächsten Monat ist er zurück.',
        day: 'Der Assistent hat sein Budget für heute aufgebraucht. Versuchen Sie es morgen wieder.',
        ip: 'Sie haben das heutige Limit für den Assistenten erreicht. Versuchen Sie es morgen wieder.',
        unavailable: 'Der Assistent ist im Moment nicht verfügbar.',
    },
};

/** Falls back to the guard's own English string, so a new scope is never blank. */
export function budgetMessage(scope: BudgetScope, lang: string | undefined, fallback: string): string {
    return COPY[lang ?? 'da']?.[scope] ?? fallback;
}
