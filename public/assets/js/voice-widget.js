/**
 * Standalone Voice Widget Script
 * Decoupled from Astro to ensure reliable execution in the browser.
 */

console.log("🔊 Voice Widget Script Loaded");

// Global Speech Synthesis Garbage Collection Fix
let voiceWidgetUtterance = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("🔊 Voice Widget Initialized");

    // Global Event Delegation for ANY speak button on the page
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.speak-btn');
        if (btn) {
            e.preventDefault();
            const text = btn.getAttribute('data-text');
            if (text) {
                try {
                    const decoded = decodeURIComponent(text);
                    speakMessage(decoded, btn);
                } catch (err) {
                    console.error("Text Decode Error", err);
                    speakMessage(text, btn);
                }
            }
        }
    });
});

function speakMessage(text, btn) {
    if (!window.speechSynthesis) {
        alert("TTS not supported.");
        return;
    }

    console.log("🔊 Speaking:", text.substring(0, 20) + "...");

    // 1. Cancel existing
    window.speechSynthesis.cancel();

    // 2. Reset UI for ALL buttons
    document.querySelectorAll('.speak-btn i').forEach(icon => {
        icon.classList.remove('text-accent', 'animate-pulse');
        icon.classList.add('text-dim-400');
    });

    const icon = btn.querySelector('i');
    if (icon) {
        icon.classList.remove('text-dim-400');
        icon.classList.add('text-accent', 'animate-pulse');
    }

    // 3. Setup Utterance
    const cleanText = text.replace(/[*#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    voiceWidgetUtterance = utterance; // Prevent GC

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 4. Voice Selection (Simplified)
    const voices = window.speechSynthesis.getVoices();
    const lang = document.documentElement.lang || 'da';
    const target = lang === 'en' ? 'en' : 'da';

    const voice = voices.find(v => v.lang.startsWith(target));
    if (voice) utterance.voice = voice;

    // 5. Handlers
    utterance.onend = () => {
        console.log("🔊 End");
        if (icon) {
            icon.classList.remove('text-accent', 'animate-pulse');
            icon.classList.add('text-dim-400');
        }
        voiceWidgetUtterance = null;
    };

    utterance.onerror = (e) => {
        console.error("🔊 Error", e);
        if (icon) {
            icon.classList.remove('text-accent', 'animate-pulse');
            icon.classList.add('text-dim-400');
        }
        voiceWidgetUtterance = null;
    };

    // 6. Speak
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        // Chrome Resume Hack
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10);
}

// Ensure voices are loaded (Chrome requirement)
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
}
