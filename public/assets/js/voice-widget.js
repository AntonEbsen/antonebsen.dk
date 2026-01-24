/**
 * Standalone Voice Widget Script
 * Decoupled from Astro to ensure reliable execution in the browser.
 */

console.log("🔊 Voice Widget Script Loaded");

// Global Speech Synthesis Garbage Collection Fix
// Global check to prevent duplicate listeners
if (window.voiceWidgetInitialized) {
    console.log("🔊 Voice Widget already initialized, skipping.");
} else {
    window.voiceWidgetInitialized = true;

    function initVoiceWidget() {
        console.log("🔊 Voice Widget Initialized");

        // Global Event Delegation for ANY speak button on the page
        document.body.addEventListener('click', (e) => {
            // Handle shadow DOM or standard click
            const path = e.composedPath ? e.composedPath() : [];
            const btn = path.find(el => el.classList && el.classList.contains('speak-btn')) || e.target.closest('.speak-btn');

            if (btn) {
                e.preventDefault();
                e.stopPropagation();

                const text = btn.getAttribute('data-text');
                if (text) {
                    console.log("🔊 Button Clicked (Delegated)");
                    try {
                        const decoded = decodeURIComponent(text);
                        speakMessage(decoded, btn);
                    } catch (err) {
                        console.error("Text Decode Error", err);
                        speakMessage(text, btn);
                    }
                } else {
                    console.warn("🔊 Speak button has no text");
                }
            }
        }, { capture: true }); // Capture phase!
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVoiceWidget);
    } else {
        initVoiceWidget();
    }
}

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
        icon.classList.remove('text-dim-400', 'fa-volume-high');
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
        icon.classList.add('text-dim-400', 'fa-volume-high');
    });
}

function resetBtn(btn) {
    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.remove('text-accent', 'animate-pulse', 'fa-stop');
        icon.classList.add('text-dim-400', 'fa-volume-high');
    }
}

// Make available globally for inline calls
window.speakMessage = speakMessage;

// Ensure voices are loaded (Chrome requirement)
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
}
