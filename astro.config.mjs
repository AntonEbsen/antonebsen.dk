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

  integrations: [
    react(),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
    })
  ],
});