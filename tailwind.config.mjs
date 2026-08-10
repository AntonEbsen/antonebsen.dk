/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // The `rgb(var(--x-rgb) / <alpha-value>)` form is what makes opacity
                // modifiers work. Handed a plain `var(--accent)` string, Tailwind has
                // no channels to inject an alpha into, so it emits nothing for
                // `bg-accent/20` — and ~414 classes in the markup carry an opacity
                // modifier. None of them rendered until this changed. The channel
                // variables are defined next to the hex tokens in BaseLayout.astro.
                bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
                card: 'rgb(var(--card-rgb) / <alpha-value>)',
                text: 'rgb(var(--text-rgb) / <alpha-value>)',
                dim: 'rgb(var(--text-dim-rgb) / <alpha-value>)',
                // `text-muted` is the class people actually write, so `muted` must
                // resolve to the solid, contrast-checked token. --muted is a 40%
                // alpha value that fails WCAG as text; it stays available as
                // var(--muted) for the few decorative uses in the Camino pages.
                muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
                // Genuinely translucent tokens: they carry their own alpha, so an
                // opacity modifier on top would compound. Left as plain vars.
                nav: 'var(--nav)',
                'nav-hover': 'var(--navHover)',
                accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
                'accent-light': 'rgb(var(--accent-light-rgb) / <alpha-value>)',
                'accent-2': 'rgb(var(--accent-2-rgb) / <alpha-value>)',
                'accent-2-soft': 'var(--accent-2-soft)',
                'accent-blue': 'var(--accent-blue)',
                'accent-soft': 'var(--accent-soft)',
                // `gold-*` was used in ~72 places but never defined here, so every
                // one of those classes silently produced no CSS. Mapped to the
                // accent so the markup that expected a colour finally gets one.
                gold: {
                    400: 'rgb(var(--accent-light-rgb) / <alpha-value>)',
                    500: 'rgb(var(--accent-rgb) / <alpha-value>)',
                    600: 'rgb(var(--accent-rgb) / <alpha-value>)',
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
                // Overriding `serif` means the 80 existing font-serif usages pick
                // Fraunces up with no markup churn. Without this they silently fall
                // back to Tailwind's default ui-serif/Georgia stack.
                serif: ['var(--font-display)'],
            }
        },
    },
    plugins: [],
}
