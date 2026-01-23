import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
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