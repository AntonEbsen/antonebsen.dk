import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
// import node from '@astrojs/node'; // Keeping import but unused in adapter

export default defineConfig({
  output: 'static',
  image: {
    service: passthroughImageService()
  },
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

  // Adapter disabled to prevent stream crash
  // adapter: node({ mode: 'standalone' }),
});