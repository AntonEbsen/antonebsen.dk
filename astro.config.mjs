import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
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
});