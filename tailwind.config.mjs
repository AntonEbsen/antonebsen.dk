/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                bg: 'var(--bg)',
                card: 'var(--card)',
                text: 'var(--text)',
                dim: 'var(--text-dim)',
                // `text-muted` is the class people actually write, so `muted` must
                // resolve to the solid, contrast-checked token. --muted is a 40%
                // alpha value that fails WCAG as text; it stays available as
                // var(--muted) for the few decorative uses in the Camino pages.
                muted: 'var(--text-muted)',
                nav: 'var(--nav)',
                'nav-hover': 'var(--navHover)',
                accent: 'var(--accent)',
                'accent-light': 'var(--accent-light)',
                'accent-2': 'var(--accent-2)',
                'accent-2-soft': 'var(--accent-2-soft)',
                'accent-blue': 'var(--accent-blue)',
                'accent-soft': 'var(--accent-soft)',
                // `gold-*` was used in ~72 places but never defined here, so every
                // one of those classes silently produced no CSS. Mapped to the
                // accent so the markup that expected a colour finally gets one.
                gold: {
                    400: 'var(--accent-light)',
                    500: 'var(--accent)',
                    600: 'var(--accent)',
                },
                glass: 'var(--glass)',
                'glass-border': 'var(--glass-border)',
            },
            boxShadow: {
                glow: 'var(--glow)',
                card: 'var(--shadow)',
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
            },
            fontFamily: {
                sans: ['var(--font-main)', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
