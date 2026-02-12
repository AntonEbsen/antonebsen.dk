import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import partytown from '@astrojs/partytown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import sentry from '@sentry/astro';
import vercel from '@astrojs/vercel';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  output: 'server',
  trailingSlash: 'never',

  image: {
    // Default is sharp, which we want.
    // service: passthroughImageService() 
  },

  site: 'https://antonebsen.dk',

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  },

  integrations: [
    sentry(),
    react(),
    sitemap(),
    // partytown({
    //   config: {
    //     forward: ["dataLayer.push"],
    //   },
    // }),
    tailwind({
      applyBaseStyles: false,
    })
  ],

  vite: {
    plugins: [
      // PWA temporarily disabled
    ]
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
});