import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://jidonglab.com',
  integrations: [react(), tailwind()],
  output: 'hybrid',
  adapter: vercel(),
});
