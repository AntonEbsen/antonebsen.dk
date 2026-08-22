/**
 * Speaking to the assistant, using the browser.
 *
 * Both clients used to record with MediaRecorder and POST the blob to /api/stt, which
 * needs an ElevenLabs key. That key exists in no environment — not locally, not in
 * Vercel — so the microphone had never once worked, while rendering unconditionally
 * with a label inviting people to use it. Click, speak, 500.
 *
 * The read-aloud button sitting next to it already used the browser's own
 * speechSynthesis and needed no key at all. That asymmetry was the entire bug: the
 * platform will do both halves for free. Web Speech also transcribes on-device or via
 * the browser vendor, so audio no longer travels to a third party at all.
 *
 * The button is *removed* where the API is missing rather than left to fail on click.
 * Firefox has no SpeechRecognition, and a control that throws is worse than one that
 * was never offered.
 */

/*
 * Minimal declarations for the Web Speech API.
 *
 * TypeScript's DOM lib does not ship them — the spec is still a draft, and the only
 * implementation in Safari is vendor-prefixed. Declaring exactly the surface used here
 * is better than an `any`: it is small, and it documents the contract this module
 * depends on.
 */
interface SpeechRecognitionAlternative {
    readonly transcript: string;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: ((event: Event) => void) | null;
    start(): void;
    stop(): void;
}

type Listener = (transcript: string) => void;

export interface VoiceInputConfig {
    /** id of the text input the transcript is typed into. */
    inputId: string;
    /** id of the form to submit once a final transcript arrives. */
    formId: string;
    /** id of the microphone button. */
    buttonId: string;
    /** BCP-47 tag for recognition. Danish dictated as Danish, not as English. */
    lang?: string;
    /** Called with the final transcript, before the form is submitted. */
    onResult?: Listener;
}

/** The vendor-prefixed constructor is still the only one Safari exposes. */
function recognitionCtor(): (new () => SpeechRecognition) | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceInputSupported(): boolean {
    return recognitionCtor() !== null;
}

const LANG_TAGS: Record<string, string> = { da: 'da-DK', de: 'de-DE', en: 'en-GB' };

export function createVoiceInput(config: VoiceInputConfig): { supported: boolean } {
    const button = document.getElementById(config.buttonId);
    const Ctor = recognitionCtor();

    if (!Ctor) {
        // Nothing to offer, so offer nothing. Leaving a dead control on screen is what
        // this change exists to stop.
        button?.remove();
        return { supported: false };
    }
    if (!button) return { supported: true };

    const input = document.getElementById(config.inputId) as HTMLInputElement | HTMLTextAreaElement | null;
    const form = document.getElementById(config.formId);
    const placeholder = input?.placeholder ?? '';

    let recognition: SpeechRecognition | null = null;
    let listening = false;

    const setListening = (on: boolean) => {
        listening = on;
        button.classList.toggle('text-accent', on);
        button.classList.toggle('animate-pulse', on);
        button.setAttribute('aria-pressed', String(on));
    };

    const stop = () => {
        recognition?.stop();
        setListening(false);
        if (input) input.placeholder = placeholder;
    };

    button.addEventListener('click', (e) => {
        e.preventDefault();
        if (listening) {
            stop();
            return;
        }

        recognition = new Ctor();
        recognition.lang = LANG_TAGS[config.lang ?? 'da'] ?? config.lang ?? 'da-DK';
        // One utterance per press: this fills a chat box, it is not dictation.
        recognition.continuous = false;
        // Interim results are what make it feel responsive — the words appear as they
        // are spoken rather than all at once when the speaker stops.
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (input) input.value = transcript.trim();

            const isFinal = event.results[event.results.length - 1].isFinal;
            if (!isFinal) return;

            stop();
            config.onResult?.(transcript.trim());
            if (transcript.trim() && form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        };

        recognition.onerror = () => {
            // A denied microphone or a silent room is not worth an error bubble; the
            // button simply returns to rest.
            stop();
        };
        recognition.onend = () => setListening(false);

        setListening(true);
        if (input) input.placeholder = '…';
        recognition.start();
    });

    return { supported: true };
}
