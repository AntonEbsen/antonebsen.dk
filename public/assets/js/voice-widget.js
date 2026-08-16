/**
 * Standalone Voice Widget Script
 * Decoupled from Astro to ensure reliable execution in the browser.
 */

console.log("🔊 Voice Widget Script Loaded");

/*
 * There used to be a capture-phase click listener on document.body here that caught
 * every `.speak-btn`, called stopPropagation, and read the text to speak out of a
 * `data-text` attribute baked in when the button was built.
 *
 * It was removed because both halves of it had stopped being true. Every speak button
 * on the site is now built by src/lib/ai/message-actions.ts, which attaches its own
 * click handler and reads the answer's text at click time — a streamed answer is empty
 * at the moment its bubble is created, so an attribute captured then is always empty
 * too. And because the delegated listener ran in the capture phase on an ancestor, its
 * stopPropagation fired *before* the button's own handler, so the button did nothing
 * at all while the delegate quietly logged "Speak button has no text".
 *
 * speakMessage() and resetAllButtons() below are still the shared implementation; only
 * the dispatch moved to the buttons themselves.
 */

// The icon's resting colour is 'text-muted'. It was 'text-dim-400', which produced no
// CSS at all — the Tailwind config defines "dim" with no numeric shades — so the reset
// only appeared to work because removing 'text-accent' let the button's own colour show
// through. See src/styles/chat.css for the same class of bug on the answer text.
function speakMessage(text, btn) {
    if (!window.speechSynthesis) {
        alert("TTS not supported.");
        return;
    }

    const icon = btn.querySelector('i');

    // Check if already speaking THIS message (Toggle Stop)
    if (icon && icon.classList.contains('fa-stop')) {
        console.log("🔊 Stopping speech");
        window.speechSynthesis.cancel();
        // UI reset will be handled by onend (or forced below)
        resetAllButtons();
        return;
    }

    console.log("🔊 Speaking:", text.substring(0, 20) + "...");

    // 1. Cancel existing
    window.speechSynthesis.cancel();

    // 2. Reset UI for ALL buttons
    resetAllButtons();

    // 3. Set Active State
    if (icon) {
        icon.classList.remove('text-muted', 'fa-volume-high');
        icon.classList.add('text-accent', 'animate-pulse', 'fa-stop');
    }

    // 4. Setup Utterance
    const cleanText = text.replace(/[*#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    voiceWidgetUtterance = utterance; // Prevent GC

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 5. Voice Selection
    const voices = window.speechSynthesis.getVoices();
    const lang = document.documentElement.lang || 'da';
    const target = lang === 'en' ? 'en' : 'da';
    const voice = voices.find(v => v.lang.startsWith(target));
    if (voice) utterance.voice = voice;

    // 6. Handlers
    utterance.onend = () => {
        console.log("🔊 End");
        resetBtn(btn);
        voiceWidgetUtterance = null;
    };

    utterance.onerror = (e) => {
        console.error("🔊 Error", e);
        resetBtn(btn);
        voiceWidgetUtterance = null;
    };

    // 7. Speak
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10);
}

function resetAllButtons() {
    document.querySelectorAll('.speak-btn i').forEach(icon => {
        icon.classList.remove('text-accent', 'animate-pulse', 'fa-stop');
        icon.classList.add('text-muted', 'fa-volume-high');
    });
}

function resetBtn(btn) {
    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.remove('text-accent', 'animate-pulse', 'fa-stop');
        icon.classList.add('text-muted', 'fa-volume-high');
    }
}

// Make available globally for inline calls
window.speakMessage = speakMessage;

// Ensure voices are loaded (Chrome requirement)
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
}
