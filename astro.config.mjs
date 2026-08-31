// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://talmolab.org',
  output: 'static',

  build: {
    // §8: Jekyll emitted /members/<slug>.html but /team/. 'preserve' mirrors the
    // source layout so both shapes come out of one build. Verified against a real
    // Workers deploy, together with the two 301 rules in public/_redirects.
    format: 'preserve',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: [
    // Self-hosted per design/type-system.css — no third-party origin, no CSP
    // exception. Subset to the ranges the content actually needs: Vietnamese
    // author names and Greek in titles are why most candidate faces were cut.
    {
      provider: fontProviders.google(),
      name: 'Source Sans 3',
      cssVariable: '--font-sans-src',
      weights: [400, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext', 'vietnamese', 'greek'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono-src',
      weights: [400, 600],
      subsets: ['latin', 'latin-ext', 'vietnamese', 'greek'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
    },
  ],
});
