/** @type {import('tailwindcss').Config} */

/* Every value here points at a token in src/styles/tokens.css. Nothing in this
   file should carry a literal colour, size or shadow — if a value is worth
   naming it belongs in the token file, which BaseLayout also inlines for first
   paint. Two systems style this site (Tailwind in markup, hand-written CSS in
   src/styles/*.css) and tokens are the only thing keeping them agreed. */
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
                // variables are defined next to the hex tokens in tokens.css.
                bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
                sunken: 'rgb(var(--bg-sunken-rgb) / <alpha-value>)',
                card: 'rgb(var(--card-rgb) / <alpha-value>)',
                text: 'rgb(var(--text-rgb) / <alpha-value>)',
                dim: 'rgb(var(--text-dim-rgb) / <alpha-value>)',
                // `text-muted` is the class people actually write, so `muted` must
                // resolve to the solid, contrast-checked token. --muted is a 40%
                // alpha value that fails WCAG as text; it stays available as
                // var(--muted) for the few decorative uses in the Camino pages.
                muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
                accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
                'accent-light': 'rgb(var(--accent-light-rgb) / <alpha-value>)',
                'accent-2': 'rgb(var(--accent-2-rgb) / <alpha-value>)',
                'accent-2-light': 'rgb(var(--accent-2-light-rgb) / <alpha-value>)',
                // Genuinely translucent tokens: they carry their own alpha, so an
                // opacity modifier on top would compound. Left as plain vars.
                nav: 'var(--nav)',
                'nav-hover': 'var(--navHover)',
                'accent-soft': 'var(--accent-soft)',
                'accent-2-soft': 'var(--accent-2-soft)',
                glass: 'var(--glass)',
                'glass-border': 'var(--glass-border)',
                // Hairlines, for the survey-map register the archive half of the
                // palette is drawn in.
                rule: 'var(--rule)',
                'rule-strong': 'var(--rule-strong)',
                'rule-accent': 'var(--rule-accent)',
                // `gold-*` was used in ~72 places but never defined here, so every
                // one of those classes silently produced no CSS. Mapped to the
                // accent so the markup that expected a colour finally gets one.
                // Shim only — do not reach for it in new markup.
                gold: {
                    400: 'rgb(var(--accent-light-rgb) / <alpha-value>)',
                    500: 'rgb(var(--accent-rgb) / <alpha-value>)',
                    600: 'rgb(var(--accent-rgb) / <alpha-value>)',
                },
            },
            boxShadow: {
                // Three steps of elevation. A single shadow everywhere is what made
                // the page read as one flat sheet.
                1: 'var(--shadow-1)',
                2: 'var(--shadow-2)',
                3: 'var(--shadow-3)',
                glow: 'var(--glow)',
                card: 'var(--shadow)',
            },
            borderRadius: {
                // Named by role rather than by size, and deliberately NOT overriding
                // Tailwind's built-in sm/md/lg/xl — remapping those would silently
                // reshape several hundred existing usages.
                DEFAULT: 'var(--radius)',
                control: 'var(--radius-sm)',
                plate: 'var(--radius-md)',
                card: 'var(--radius-lg)',
                panel: 'var(--radius-xl)',
            },
            spacing: {
                // Sits alongside Tailwind's numeric scale rather than replacing it.
                '3xs': 'var(--space-3xs)',
                '2xs': 'var(--space-2xs)',
                xs: 'var(--space-xs)',
                sm: 'var(--space-sm)',
                md: 'var(--space-md)',
                lg: 'var(--space-lg)',
                xl: 'var(--space-xl)',
                '2xl': 'var(--space-2xl)',
                '3xl': 'var(--space-3xl)',
            },
            maxWidth: {
                // Replaces fifteen hand-picked container widths that had no
                // relationship to one another. `prose` overrides Tailwind's 65ch.
                prose: 'var(--width-prose)',
                content: 'var(--width-content)',
                wide: 'var(--width-wide)',
            },
            fontSize: {
                meta: 'var(--step--1)',
                body: 'var(--step-0)',
                lead: 'var(--step-1)',
                'title-sm': 'var(--step-2)',
                'title-md': 'var(--step-3)',
                'title-lg': 'var(--step-4)',
                'display-sm': 'var(--step-5)',
                'display-lg': 'var(--step-6)',
            },
            fontFamily: {
                sans: ['var(--font-main)'],
                // Overriding `serif` means the 96 existing font-serif usages pick
                // Fraunces up with no markup churn. Without this they silently fall
                // back to Tailwind's default ui-serif/Georgia stack.
                serif: ['var(--font-display)'],
                mono: ['var(--font-mono)'],
            },
            zIndex: {
                nav: 'var(--z-nav)',
                dropdown: 'var(--z-dropdown)',
                overlay: 'var(--z-overlay)',
                modal: 'var(--z-modal)',
                toast: 'var(--z-toast)',
                grain: 'var(--z-grain)',
                skip: 'var(--z-skip)',
            },
            transitionDuration: {
                quick: 'var(--dur-quick)',
                base: 'var(--dur-base)',
                slow: 'var(--dur-slow)',
                draw: 'var(--dur-draw)',
            },
            transitionTimingFunction: {
                out: 'var(--ease-out)',
                entrance: 'var(--ease-entrance)',
                overshoot: 'var(--ease-overshoot)',
            },
            screens: {
                // ~20 hand-written media queries in src/styles/*.css break at 980px,
                // which matched no Tailwind breakpoint. Naming it lets the two
                // systems agree instead of interleaving.
                stack: '980px',
            },
        },
    },
    plugins: [],
}
