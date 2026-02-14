import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';

export default defineConfig({
  integrations: [react(), clerk()],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});
