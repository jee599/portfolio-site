import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://jidonglab.com',
  integrations: [react(), tailwind()],
  output: 'hybrid',
  adapter: cloudflare(),
  image: { service: { entrypoint: "astro/assets/services/noop" } },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
