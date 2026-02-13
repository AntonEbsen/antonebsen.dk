import { useEffect } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';

export default function SmartFootnote() {
    useEffect(() => {
        // Select all footnote links (e.g., [1])
        const links = document.querySelectorAll('a[href^="#ref-"], a[href^="#fn-"]');

        links.forEach(link => {
            const targetId = link.getAttribute('href')?.substring(1);
            const targetEl = document.getElementById(targetId || '');

            if (targetEl) {
                // Extract content: Remove the back link (↩) to keep it clean
                const content = targetEl.innerHTML.replace(/<a[^>]*>↩<\/a>/, '').trim();

                tippy(link, {
                    content: content,
                    allowHTML: true,
                    theme: 'platinum',
                    arrow: true,
                    interactive: true,
                    maxWidth: 350,
                    delay: [200, 300], // Wikipedia-style: slow show, slow hide
                    animation: 'shift-away',
                    touch: ['hold', 500],
                });
            }
        });
    }, []);

    return null; // Logic only component
}
