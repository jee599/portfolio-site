import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jidonglab.com',
  integrations: [react(), tailwind(), sitemap()],
  output: 'hybrid',
  adapter: cloudflare(),
  image: { service: { entrypoint: "astro/assets/services/noop" } },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
