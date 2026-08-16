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

        // An apparatus, not a row of tags: a rule, a small-caps heading, then a
        // numbered list. This is the register the site already uses for anything
        // citational, and on a page arguing that every claim is traceable, the
        // sources should look like a bibliography rather than like filter chips.
        const apparatus = document.createElement('div');
        apparatus.className = 'citation-apparatus';

        const label = document.createElement('p');
        label.className = 'citation-label';
        // Was the literal string 'Sources' on a site whose default language is Danish.
        label.textContent = CITATION_LABELS[lang] ?? CITATION_LABELS.da;
        apparatus.appendChild(label);

        const list = document.createElement('ol');
        list.className = 'citation-list';

        for (const s of sources as Source[]) {
            if (!s || typeof s.title !== 'string') continue;
            const item = document.createElement('li');
            // Defensive second check: only ever emit a site-relative link.
            const linkable = typeof s.url === 'string' && s.url.startsWith('/');
            const el = document.createElement(linkable ? 'a' : 'span');
            if (linkable) el.setAttribute('href', s.url as string);
            el.textContent = s.title;
            item.appendChild(el);
            list.appendChild(item);
        }

        if (!list.childElementCount) return;
        apparatus.appendChild(list);
        bubbleOf(container).appendChild(apparatus);
        scroll();
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

    return { handleToolEvent, renderCitations };
}
