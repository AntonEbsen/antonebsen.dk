import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import sentry from '@sentry/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  trailingSlash: 'never',

  site: 'https://antonebsen.dk',

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  },

  integrations: [
    sentry({
      // Belt-and-braces alongside dropping replayIntegration() from
      // sentry.client.config.js: these strip replay and debug code even if it is
      // pulled in transitively, so the client bundle cannot silently regrow.
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true,
        excludeReplayCanvas: true,
      },
    }),
    react(),
    sitemap({
      // Keep admin, internal and API routes out of the sitemap.
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/dashboard') &&
        !page.includes('/debug') &&
        !page.includes('/api/') &&
        !/\/test-[^/]+\/?$/.test(page),
    }),
    tailwind({
      applyBaseStyles: false,
    })
  ],

  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
});
