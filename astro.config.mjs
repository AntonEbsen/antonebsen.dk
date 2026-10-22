import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import sentry from '@sentry/astro';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  // Preserve the existing spacing between inline elements across the v7 upgrade.
  compressHTML: true,
  trailingSlash: 'never',

  site: 'https://antonebsen.dk',

  // Off under CI. Playwright runs against `astro dev`, and the dev toolbar mounts
  // its own headings ("Audit", "No islands detected.", "Settings") in an open
  // shadow root that Playwright locators see through — so a plain `h1` locator
  // resolved to five elements and the ledger tests failed, or passed, on the
  // toolbar's timing. A developer's own preference (`astro preferences`) still
  // decides locally.
  devToolbar: {
    enabled: !process.env.CI,
  },

  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
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
        !/\/(?:en\/)?research\/?$/.test(new URL(page).pathname) &&
        !/\/test-[^/]+\/?$/.test(page),
      serialize(item) {
        if (new URL(item.url).pathname.match(/^\/en(?:\/|$)/)) {
          const url = new URL(item.url);
          url.hostname = 'www.antonebsen.com';
          item.url = url.href;
        }
        return item;
      },
    }),
  ],

  // Analytics is already loaded by BaseLayout; newer adapters no longer inject it.
  adapter: vercel(),
  // Tailwind's maintained Vite integration replaces the obsolete Astro plugin.
  vite: {
    plugins: [tailwind()],
  },
});
