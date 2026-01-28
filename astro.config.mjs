import { defineConfig } from 'astro/config';
// Design System: Dark & Gold
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
// import node from '@astrojs/node'; // Removed Node adapter
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  site: 'https://antonebsen.dk',

  i18n: {
    defaultLocale: "da",
    locales: ["da", "en"],
    routing: {
      prefixDefaultLocale: false
    }
  },

  integrations: [
    react(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
});