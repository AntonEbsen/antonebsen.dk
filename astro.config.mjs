import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import partytown from '@astrojs/partytown';

import sentry from '@sentry/astro';
import vercel from '@astrojs/vercel';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  output: 'static',
  trailingSlash: 'never',

  image: {
    // Default is sharp, which we want.
    // service: passthroughImageService() 
  },

  site: 'https://antonebsen.dk',

  integrations: [
    // sentry(),
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
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Anton Ebsen - Portfolio',
          short_name: 'Anton Ebsen',
          description: 'Portfolio of Anton Meier Ebsen Jørgensen',
          theme_color: '#050505',
          background_color: '#050505',
          display: 'standalone',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ]
  },

  adapter: vercel(),
});