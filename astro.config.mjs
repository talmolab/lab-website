// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The preview lives on workers.dev. SITE_URL lets the same build target talmolab.org
// later; anything that is not talmolab.org is treated as a preview and kept out of
// search indexes (see src/layouts/Shell.astro and scripts/robots.mjs).
const site = process.env.SITE_URL ?? 'https://talmolab-redux.talmo-lab.workers.dev';

export default defineConfig({
  site,
  output: 'static',

  build: {
    // Same URL shapes as the lab-website Astro build and the Jekyll site it
    // replaces: /members/<slug>.html beside /team/. See public/_redirects.
    format: 'preserve',
  },

  integrations: [
    sitemap({
      serialize(item) {
        const u = new URL(item.url);
        if (!u.pathname.startsWith('/members/') && !u.pathname.endsWith('/')) {
          u.pathname += '/';
          item.url = u.href;
        }
        return item;
      },
    }),
  ],

  fonts: [
    // Source Sans 3 + JetBrains Mono, self-hosted. Subsets include Vietnamese and
    // Greek: coverage of real author names and titles is why these faces were chosen.
    {
      provider: fontProviders.google(),
      name: 'Source Sans 3',
      cssVariable: '--font-sans-src',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext', 'vietnamese', 'greek'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono-src',
      weights: [400, 500],
      subsets: ['latin', 'latin-ext', 'vietnamese', 'greek'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
  ],
});
