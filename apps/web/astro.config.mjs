import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';

export default defineConfig({
  integrations: [
    react(),
    clerk({
      appearance: {
        baseTheme: 'dark',
      },
    }),
  ],
  adapter: vercel(),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});
