/**
 * The controls that hang under a finished assistant answer: copy, and regenerate.
 *
 * Built here rather than in each client because the widget and the full-page chat are
 * near-copies of one another, and the last time this row was written twice the two
 * copies drifted: the widget grew a copy button that only rendered when `addMessage`
 * was called with text already in hand — which streaming never does — so it appeared
 * on replayed history and never on an answer the visitor had just watched arrive. The
 * full-page chat never got one at all.
 *
 * Reading the text at click time instead of at construction time is what fixes that,
 * and it is the reason this module takes DOM nodes rather than strings.
 */

type Lang = 'da' | 'en' | 'de';

const LABELS: Record<Lang, { copy: string; copied: string; failed: string; regenerate: string; speak: string }> = {
    da: { copy: 'Kopiér svaret', copied: 'Kopieret', failed: 'Kunne ikke kopiere', regenerate: 'Generér et nyt svar', speak: 'Læs svaret højt' },
    en: { copy: 'Copy answer', copied: 'Copied', failed: "Couldn't copy", regenerate: 'Regenerate answer', speak: 'Read answer aloud' },
    de: { copy: 'Antwort kopieren', copied: 'Kopiert', failed: 'Kopieren fehlgeschlagen', regenerate: 'Neue Antwort erzeugen', speak: 'Antwort vorlesen' },
};

declare global {
    interface Window {
        speakMessage?: (text: string, btn: HTMLElement) => void;
    }
}

/**
 * Where a regenerate cuts: the index of the last question asked.
 *
 * Everything from there on is discarded — the question included — because the ordinary
 * send path is about to re-add it. Returns -1 when there is nothing to retry.
 *
 * Split out because it is the part that can be wrong without being visibly wrong: an
 * off-by-one leaves the question on screen twice, or silently eats the exchange before
 * it. The transcript can also end on a question with no answer, which is what a stopped
 * reply leaves behind, and that must still be retryable.
 */
export function rewindIndex(entries: readonly { role?: string }[]): number {
    for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i]?.role === 'user') return i;
    }
    return -1;
}

export interface MessageActionsConfig {
    /** id of the text input, refilled by regenerate before resubmitting. */
    inputId: string;
    /** id of the form to submit. */
    formId: string;
    /** id of the scrollable message list. */
    messagesId: string;
    /** localStorage key holding the transcript, so a regenerate can rewind it. */
    storageKey: string;
    /** True while a reply is streaming. Regenerate stands aside rather than racing it. */
    isBusy?: () => boolean;
    lang?: string;
    classes: {
        row: string;
        button: string;
    };
}

/** Writes to the clipboard, falling back for browsers without a secure context. */
async function writeClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Permission denied, or an insecure context. Fall through to the old way.
    }
    try {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        // Off-screen rather than hidden: a display:none textarea cannot be selected.
        scratch.style.cssText = 'position:fixed;top:-9999px;opacity:0';
        document.body.appendChild(scratch);
        scratch.select();
        const ok = document.execCommand('copy');
        scratch.remove();
        return ok;
    } catch {
        return false;
    }
}

export function createMessageActions(config: MessageActionsConfig) {
    const t = LABELS[(config.lang as Lang)] ?? LABELS.da;

    function button(icon: string, label: string): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = config.classes.button;
        // Icon-only, so the accessible name has to come from the attributes. These used
        // to be missing, which is what `button-name` in the a11y baseline was about.
        btn.setAttribute('aria-label', label);
        btn.title = label;
        const i = document.createElement('i');
        i.className = icon;
        btn.appendChild(i);
        return btn;
    }

    /** The answer's prose, without the "AI ANALYSIS" header or the source pills. */
    function proseOf(wrapper: Element): string {
        const prose = wrapper.querySelector('.chat-prose');
        return (prose instanceof HTMLElement ? prose.innerText : wrapper.textContent || '').trim();
    }

    function makeCopy(wrapper: Element): HTMLButtonElement {
        const btn = button('fa-regular fa-copy text-xs', t.copy);
        const icon = btn.querySelector('i') as HTMLElement;

        // Announced rather than only shown, since the confirmation is a changed icon.
        const announce = document.createElement('span');
        announce.className = 'sr-only';
        announce.setAttribute('aria-live', 'polite');
        btn.appendChild(announce);

        let resetTimer = 0;
        btn.addEventListener('click', async () => {
            const ok = await writeClipboard(proseOf(wrapper));
            icon.className = ok ? 'fa-solid fa-check text-xs' : 'fa-solid fa-xmark text-xs';
            announce.textContent = ok ? t.copied : t.failed;
            btn.setAttribute('aria-label', ok ? t.copied : t.failed);

            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(() => {
                icon.className = 'fa-regular fa-copy text-xs';
                announce.textContent = '';
                btn.setAttribute('aria-label', t.copy);
            }, 1800);
        });
        return btn;
    }

    /**
     * Read the answer aloud.
     *
     * The class name is load-bearing: `resetAllButtons()` in voice-widget.js finds every
     * `.speak-btn i` to clear the playing state. This used to be an inline onclick
     * carrying `encodeURIComponent(text)` in a data attribute and handing it straight to
     * the speech synthesiser, so answers were read out with their percent-escapes — and
     * because the text was captured when the bubble was built, a streamed answer was
     * always captured empty. Reading the prose at click time fixes both.
     */
    function makeSpeak(wrapper: Element): HTMLButtonElement {
        const btn = button('fa-solid fa-volume-high text-xs', t.speak);
        btn.classList.add('speak-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.speakMessage?.(proseOf(wrapper), btn);
        });
        return btn;
    }

    /**
     * Rewind to just before the last question and ask it again.
     *
     * Both the transcript in localStorage and the rows on screen are truncated back to
     * that point, then the ordinary submit path runs. Re-using the send path rather
     * than calling the API directly is deliberate: the question, the streaming, the
     * rate limiting and the stop button all keep behaving exactly as they do normally,
     * and there is no second code path to keep in step with the first.
     */
    function makeRegenerate(): HTMLButtonElement {
        const btn = button('fa-solid fa-rotate-right text-xs', t.regenerate);
        btn.dataset.action = 'regenerate';

        btn.addEventListener('click', () => {
            if (config.isBusy?.()) return;

            const msgs = document.getElementById(config.messagesId);
            const input = document.getElementById(config.inputId) as HTMLInputElement | HTMLTextAreaElement | null;
            const form = document.getElementById(config.formId);
            if (!msgs || !input || !form) return;

            const rows = Array.from(msgs.querySelectorAll<HTMLElement>('[data-role]'));
            const lastUser = rewindIndex(rows.map((r) => ({ role: r.dataset.role })));
            if (lastUser < 0) return;

            const question = rows[lastUser].dataset.text || '';
            if (!question) return;

            rows.slice(lastUser).forEach((r) => r.remove());

            try {
                const stored = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
                if (Array.isArray(stored)) {
                    const cut = rewindIndex(stored);
                    if (cut >= 0) {
                        localStorage.setItem(config.storageKey, JSON.stringify(stored.slice(0, cut)));
                    }
                }
            } catch {
                // A corrupt transcript should not block the retry; the send path rebuilds it.
            }

            input.value = question;
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });

        return btn;
    }

    /**
     * Regenerate only ever acts on the most recent exchange, so it is only ever offered
     * there. Older answers keep their copy and read-aloud buttons.
     *
     * Also syncs the disabled state, which is why the clients call this from
     * `setStreaming` as well: a button that silently ignores clicks while a reply is
     * arriving reads as broken, so it greys out instead.
     */
    function refreshRegenerate(): void {
        const msgs = document.getElementById(config.messagesId);
        if (!msgs) return;
        const busy = config.isBusy?.() ?? false;
        const wrappers = msgs.querySelectorAll('.ai-content-wrapper');
        wrappers.forEach((w, i) => {
            const existing = w.querySelector<HTMLButtonElement>('[data-action="regenerate"]');
            const last = i === wrappers.length - 1;
            if (!last) {
                existing?.remove();
                return;
            }
            const btn = existing ?? makeRegenerate();
            if (!existing) w.querySelector('[data-actions]')?.appendChild(btn);
            btn.disabled = busy;
            btn.classList.toggle('opacity-40', busy);
            btn.classList.toggle('pointer-events-none', busy);
        });
    }

    /** Build the row and hang it under one assistant bubble. */
    function attach(wrapper: Element): void {
        if (!wrapper || wrapper.querySelector('[data-actions]')) return;
        const row = document.createElement('div');
        row.className = config.classes.row;
        row.setAttribute('data-actions', '');
        row.appendChild(makeCopy(wrapper));
        row.appendChild(makeSpeak(wrapper));
        wrapper.appendChild(row);

        // Both clients build the whole bubble detached and append it to the list
        // afterwards, so at this point the document cannot yet say which assistant
        // message is the last one. Asking after the current task has run can.
        if (wrapper.isConnected) refreshRegenerate();
        else queueMicrotask(refreshRegenerate);
    }

    return { attach, refreshRegenerate };
}
