/**
 * The one place a model id and its generation settings are written down.
 *
 * The site ran on Google Gemini until this file changed. Two things drove the move
 * to Claude: the Gemini key was on a free tier capped at twenty requests per day
 * for the whole project — not a public chat widget — and the assistant's job here
 * (answering from a fixed corpus and citing which essay a claim came from) rewards
 * instruction-following more than raw speed.
 *
 * Pinned rather than floating, because the previous provider's chat was dead in
 * production for weeks after a pinned model was retired and nothing surfaced it.
 * `npm run verify:model` asserts this id is still served; the chat route logs
 * stream failures instead of letting them vanish into an empty reply.
 */

/**
 * Claude Sonnet 5 — near-Opus quality on grounded question answering at roughly a
 * third less per message, with a 1M-token context window the corpus sits well
 * inside. `npm run eval` runs the golden set against whatever is set here, so
 * A/B this against `claude-opus-5` (stronger synthesis, ~$18/1k messages) or
 * `claude-haiku-4-5` (~$4/1k, snappier, weaker at comparing arguments across
 * essays) on real questions rather than guessing.
 */
export const CHAT_MODEL = 'claude-sonnet-5';

/**
 * Effort controls how much the model thinks and how hard it works before
 * answering. `medium` is the balanced step-down from the `high` default: on
 * Sonnet 5 it lands around where Sonnet 4.6 sat at `high`, which is more than
 * enough for corpus-grounded answers, and it keeps the widget responsive.
 *
 * Raise to `high` if citations start pointing at the wrong essay; drop to `low`
 * for a snappier widget on simple biographical lookups.
 */
export const EFFORT = 'medium' as const;

/**
 * Caps thinking *and* visible text together, so this needs headroom beyond the
 * length of an answer. Replies here run a few hundred tokens; the rest is room
 * for adaptive thinking and a chart tool call in the same turn.
 *
 * Note there is deliberately no `temperature` here. Sonnet 5 rejects non-default
 * sampling parameters with a 400 — tone and determinism are steered from the
 * system prompt instead.
 */
export const MAX_TOKENS = 4096;

/** Human-readable label for UI copy, so the badge cannot drift from the model. */
export const MODEL_LABEL = 'Claude Sonnet 5';

/**
 * Shared request settings. Adaptive thinking is the default on Sonnet 5 when the
 * field is omitted, but it is stated explicitly so the behaviour is visible at the
 * call site rather than implied. Thinking content is never rendered — the widget
 * shows its own progress indicator during the pause — so `display` is left at its
 * default and thinking blocks are ignored downstream.
 */
export const GEN = {
    model: CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'adaptive' as const },
    output_config: { effort: EFFORT },
};
