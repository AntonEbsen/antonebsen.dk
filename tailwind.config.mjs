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
                muted: 'var(--muted)',
                nav: 'var(--nav)',
                'nav-hover': 'var(--navHover)',
                accent: 'var(--accent)',
                'accent-blue': 'var(--accent-blue)',
                'accent-soft': 'var(--accent-soft)',
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
