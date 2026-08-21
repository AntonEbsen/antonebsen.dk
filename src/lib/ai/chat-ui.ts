import { isAllowedNavPath } from './safe-html';
import type { Source } from './corpus';
import { readChartChrome, readChartPalette } from './chat-theme';

/**
 * Renderers for the assistant's tool calls, shared by the chat widget and the
 * full-page chat.
 *
 * These two clients are near-copies of each other, and the tag-parsing they used to
 * do lived in both — so a fix to one silently left the other wrong. The tools are
 * typed stream events now, and this is the one place that turns them into DOM.
 *
 * Everything here builds nodes and sets `textContent`. No model-supplied string is
 * ever interpolated into markup, and the only href that can be produced is a
 * site-relative path that came from the corpus, not from the model.
 */

export interface ChatUIConfig {
    /** id of the text input, used by suggestion chips to refill and resubmit. */
    inputId: string;
    /** id of the form to submit when a chip is clicked. */
    formId: string;
    /** id of the scrollable message list. */
    messagesId: string;
    /** Page language, for the few strings this module owns. */
    lang?: string;
    /** Called when the model awards a ledger entry. */
    onLedgerEntry?: (entry: string) => void;
    classes: {
        chartBox: string;
        chartCaption: string;
        nav: string;
        chip: string;
        quizBox: string;
        quizTitle: string;
        quizBody: string;
    };
}

// Read per chart rather than once at module load: the tokens are on the document, and
// this module is imported before the stylesheet is guaranteed to have applied.
const chartColours = () => readChartPalette();

/**
 * Per-message id -> ordinal, kept outside the DOM because the DOM does not survive.
 *
 * Both clients rebuild the whole answer with `innerHTML = format(accumulatedText)` on
 * every text chunk, so any numbering written into a marker is destroyed by the next
 * one. The map outlives that, and numbering is re-applied after each rebuild instead
 * of once. Keyed on the message wrapper and weakly held, so clearing the transcript
 * drops it.
 */
const citationIndex = new WeakMap<Element, Map<string, CitationEntry>>();

interface CitationEntry {
    ordinal: number;
    /** Element id of this source's entry in the apparatus, for the marker to link to. */
    anchor: string;
}

/** Honoured by the footnote jump, as Skeleton.tsx already does for its shimmer. */
const reducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * What to do with one citation marker on one pass. Exported because this is the part
 * where being wrong is not obviously wrong — the rest of numberCitations is DOM
 * construction, which this project has no test environment for.
 *
 * The trap it exists to name: markers and the `citations` event arrive in either order,
 * and the prose is rebuilt from scratch on every streamed chunk. So an unresolved
 * marker must be *kept* mid-stream — the citeSources call may still be coming, and a
 * pass that deleted it would leave an answer that cites at the very end with no markers
 * at all, because no further text event would rebuild them. At the end of the turn the
 * same marker must be *dropped*, because nothing will resolve it now and a numberless
 * superscript points at nothing.
 */
export function citationAction(opts: {
    /** Has this id resolved to a source yet? */
    resolved: boolean;
    /** Does the marker already carry its number, i.e. no rebuild since the last pass? */
    alreadyNumbered: boolean;
    /** Is this the final pass, after the last word has arrived? */
    dropUnresolved: boolean;
}): 'number' | 'remove' | 'skip' {
    if (!opts.resolved) return opts.dropUnresolved ? 'remove' : 'skip';
    return opts.alreadyNumbered ? 'skip' : 'number';
}

/** Distinguishes one answer's footnote anchors from the next one's in a transcript. */
let apparatusSeq = 0;

const CITATION_LABELS: Record<string, string> = {
    da: 'Kilder',
    en: 'Sources',
    de: 'Quellen',
};

export function createChatRenderers(config: ChatUIConfig) {
    const { classes, lang = 'da' } = config;

    const scroll = () => {
        const msgs = document.getElementById(config.messagesId);
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
    };

    const bubbleOf = (container: Element): Element =>
        container.querySelector('.message-bubble') || container;

    function renderChart(spec: any, container: Element): void {
        const canvasId = 'chart-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        const box = document.createElement('div');
        box.className = classes.chartBox;

        if (spec.title) {
            const caption = document.createElement('p');
            caption.className = classes.chartCaption;
            caption.textContent = spec.title;
            box.appendChild(caption);
        }

        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        box.appendChild(canvas);
        bubbleOf(container).appendChild(box);
        scroll();

        const radial = spec.type === 'pie' || spec.type === 'doughnut' || spec.type === 'radar';

        const chrome = readChartChrome();

        import('chart.js/auto').then(({ default: Chart }) => {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;
            new Chart(ctx as HTMLCanvasElement, {
                type: spec.type,
                data: {
                    labels: spec.labels,
                    datasets: [{
                        label: spec.datasetLabel || '',
                        data: spec.data,
                        backgroundColor: (() => {
                            const ramp = chartColours();
                            return (spec.labels || []).map(
                                (_: unknown, i: number) => ramp[i % ramp.length],
                            );
                        })(),
                    }],
                },
                options: {
                    responsive: true,
                    indexAxis: spec.type === 'bar' ? 'y' : 'x',
                    color: chrome.text,
                    borderColor: chrome.grid,
                    scales: radial ? undefined : {
                        x: { ticks: { color: chrome.text }, grid: { color: chrome.grid } },
                        y: { ticks: { color: chrome.text }, grid: { color: chrome.grid } },
                    },
                    plugins: { legend: { labels: { color: chrome.text } } },
                } as any,
            });
        });
    }

    function renderNavigation(path: unknown, container: Element): void {
        // The allowlist is the tool schema's enum, so an off-list path is rejected by
        // the API before it reaches the browser. This is the check at the point of
        // use: window.location is what actually moves the visitor.
        if (!isAllowedNavPath(path)) {
            console.warn('[chat] blocked navigation to an off-allowlist path:', path);
            return;
        }
        const nav = document.createElement('div');
        nav.className = classes.nav;
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-arrow-right-long';
        nav.appendChild(icon);
        nav.appendChild(document.createTextNode(` Navigating to ${path}...`));
        bubbleOf(container).appendChild(nav);
        scroll();
        setTimeout(() => { window.location.href = path; }, 500);
    }

    function renderSuggestions(suggestions: unknown, container: Element): void {
        if (!Array.isArray(suggestions) || !suggestions.length) return;
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2 mt-4 w-full';

        for (const s of suggestions) {
            if (typeof s !== 'string') continue;
            const btn = document.createElement('button');
            btn.className = classes.chip;
            btn.type = 'button';
            btn.textContent = s;
            btn.addEventListener('click', () => {
                const input = document.getElementById(config.inputId) as HTMLInputElement | HTMLTextAreaElement | null;
                const form = document.getElementById(config.formId);
                if (input && form) {
                    input.value = s;
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    row.remove();
                }
            });
            row.appendChild(btn);
        }
        container.appendChild(row);
        scroll();
    }

    /**
     * One multiple-choice question with clickable options.
     *
     * The correct index is graded **here**, not on the server, so the visitor finds out
     * instantly instead of waiting on a round trip to be told something the client
     * already knew. The answer then goes back as an ordinary message so the model can
     * react and ask the next one — the conversation is the quiz's only state.
     *
     * This does mean a determined visitor can read the answer in devtools. For a quiz
     * on a personal site that is a fair trade for the responsiveness.
     */
    function renderQuizQuestion(input: any, container: Element): void {
        const options: unknown[] = Array.isArray(input.options) ? input.options : [];
        if (!options.length) return;

        const box = document.createElement('div');
        box.className = classes.quizBox;

        const question = document.createElement('p');
        question.className = classes.quizTitle;
        question.textContent = String(input.question ?? '');
        box.appendChild(question);

        const list = document.createElement('div');
        list.className = 'flex flex-col gap-2 mt-3';

        const verdict = document.createElement('p');
        verdict.className = classes.quizBody;

        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = classes.chip + ' text-left';
            btn.textContent = String(option);

            btn.addEventListener('click', () => {
                const right = index === Number(input.correctIndex);

                // Lock the whole set so a wrong guess cannot be walked back.
                list.querySelectorAll('button').forEach((b) => {
                    (b as HTMLButtonElement).disabled = true;
                    b.classList.add('opacity-60');
                });
                btn.classList.remove('opacity-60');
                btn.classList.add(right ? 'ring-2' : 'line-through', 'opacity-100');

                verdict.textContent = right
                    ? `Correct. ${input.explanation ?? ''}`
                    : `Not quite — the answer was "${options[Number(input.correctIndex)]}". ${input.explanation ?? ''}`;
                box.appendChild(verdict);
                scroll();

                // Tell the model what happened so it can respond and continue.
                const field = document.getElementById(config.inputId) as HTMLInputElement | HTMLTextAreaElement | null;
                const form = document.getElementById(config.formId);
                if (field && form) {
                    field.value = `I answered "${option}" — ${right ? 'correct' : 'wrong'}. Next question please.`;
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
            });

            list.appendChild(btn);
        });

        box.appendChild(list);
        container.appendChild(box);
        scroll();
    }

    /**
     * Sources are resolved server-side from the same corpus that built the prompt, so
     * titles and URLs are ours. An id the model invented is dropped before it gets
     * here — there is no path from model text to an href.
     */
    function renderCitations(sources: Source[] | unknown, container: Element): void {
        if (!Array.isArray(sources) || !sources.length) return;

        const bubble = bubbleOf(container);

        // An apparatus, not a row of tags: a rule, a small-caps heading, then a
        // numbered list. This is the register the site already uses for anything
        // citational, and on a page arguing that every claim is traceable, the
        // sources should look like a bibliography rather than like filter chips.
        //
        // A second citeSources call in the same answer extends this list rather than
        // starting a rival one below it. Two blocks would each restart at 1, and the
        // inline markers point at ordinals — so "see 2" would have had two answers.
        let apparatus = bubble.querySelector('.citation-apparatus');
        let list = apparatus ? apparatus.querySelector('ol.citation-list') : null;

        if (!apparatus) {
            apparatus = document.createElement('div');
            apparatus.className = 'citation-apparatus';

            const label = document.createElement('p');
            label.className = 'citation-label';
            // Was the literal string 'Sources' on a site whose default language is Danish.
            label.textContent = CITATION_LABELS[lang] ?? CITATION_LABELS.da;
            apparatus.appendChild(label);

            list = document.createElement('ol');
            list.className = 'citation-list';
        }

        let index = citationIndex.get(container);
        if (!index) {
            index = new Map<string, CitationEntry>();
            citationIndex.set(container, index);
            apparatusSeq += 1;
        }
        const seq = apparatusSeq;

        for (const s of sources as Source[]) {
            if (!s || typeof s.title !== 'string') continue;
            // The same source cited twice keeps one entry and one number, which is what
            // a reader expects of a footnote and what makes the ordinal a stable
            // reference rather than a running count of tool calls.
            if (typeof s.id === 'string' && index.has(s.id)) continue;

            const ordinal = index.size + 1;
            const item = document.createElement('li');
            item.id = 'cite-' + seq + '-' + ordinal;
            // Defensive second check: only ever emit a site-relative link.
            const linkable = typeof s.url === 'string' && s.url.startsWith('/');
            const el = document.createElement(linkable ? 'a' : 'span');
            if (linkable) el.setAttribute('href', s.url as string);
            el.textContent = s.title;
            item.appendChild(el);
            list!.appendChild(item);

            if (typeof s.id === 'string') index.set(s.id, { ordinal, anchor: item.id });
        }

        if (!list!.childElementCount) return;
        if (!apparatus.contains(list!)) apparatus.appendChild(list!);
        if (!bubble.contains(apparatus)) bubble.appendChild(apparatus);

        // The markers are usually already in the prose by now — the model writes them
        // as it writes the sentence, and citeSources lands after. Number them here as
        // well as on every text update, because an answer that ends on a citation gets
        // no further text event to trigger the other path.
        numberCitations(container);
        scroll();
    }

    /**
     * Give every `[^id]` marker in the prose its number and a link to the entry below.
     *
     * Ordering is the whole difficulty. The `citations` event and the prose carrying
     * the markers arrive in either order, and the prose is rebuilt from scratch on
     * every chunk — so this runs after each text update *and* when citations arrive,
     * rather than once.
     *
     * `dropUnresolved` is off during streaming and on at the end. A marker whose id has
     * not resolved *yet* must survive the pass, or an answer that cites at the very end
     * would have had its markers deleted by every pass before it; a marker whose id
     * never resolves must not be left in the finished prose, where it would sit as a
     * numberless superscript pointing at nothing. Removing it is safe precisely because
     * the next rebuild re-creates every marker from the raw text.
     */
    function numberCitations(
        container: Element | null,
        { dropUnresolved = false }: { dropUnresolved?: boolean } = {},
    ): void {
        if (!container) return;
        const index = citationIndex.get(container);

        // The markers live in the prose; the caller's handle may be a sibling of it.
        // Both astro clients pass the wrapper, which contains everything; the Reviewer
        // passes the extras node React owns, which sits beside the prose inside the
        // bubble. Widening to the bubble covers both without either caller having to
        // know where the other keeps its nodes.
        const scope = container.closest('.message-bubble') ?? container;

        for (const marker of Array.from(scope.querySelectorAll('sup.citation-ref'))) {
            const id = marker.getAttribute('data-source-id') ?? '';
            const entry = index ? index.get(id) : undefined;

            const action = citationAction({
                resolved: Boolean(entry),
                alreadyNumbered: Boolean(marker.firstChild),
                dropUnresolved,
            });
            if (action === 'remove') marker.remove();
            if (action !== 'number' || !entry) continue;

            const link = document.createElement('a');
            link.className = 'citation-ref-link';
            link.href = '#' + entry.anchor;
            link.textContent = String(entry.ordinal);
            const label = CITATION_LABELS[lang] ?? CITATION_LABELS.da;
            link.setAttribute('aria-label', label + ' ' + entry.ordinal);
            // Jump inside the transcript instead of letting the hash move the page and
            // stack a history entry per footnote. The flash is what tells the reader
            // which line answered them when several sources sit together.
            link.addEventListener('click', (e) => {
                const target = document.getElementById(entry.anchor);
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
                target.classList.add('citation-target');
                setTimeout(() => target.classList.remove('citation-target'), 1200);
            });
            marker.appendChild(link);
        }
    }

    /**
     * Dispatch one tool event. The input was validated against the tool's JSON Schema
     * server-side, so its shape is known — it is still treated as data here.
     */
    function handleToolEvent(name: string, input: any, container: Element | null): void {
        if (!container || !input) return;
        try {
            switch (name) {
                case 'showChart': renderChart(input, container); break;
                case 'navigateTo': renderNavigation(input.path, container); break;
                case 'suggestFollowUps': renderSuggestions(input.suggestions, container); break;
                case 'askQuizQuestion': renderQuizQuestion(input, container); break;
                case 'recordLedgerEntry': config.onLedgerEntry?.(String(input.entry)); break;
                default: console.warn('[chat] unknown tool:', name);
            }
        } catch (e) {
            console.error('[chat] tool render failed:', name, e);
        }
    }

    return { handleToolEvent, renderCitations, numberCitations };
}
