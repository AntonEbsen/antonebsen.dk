import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
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