import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';

export default defineConfig({
  integrations: [
    react(),
    // clerk({
    //   proxyUrl: import.meta.env.PUBLIC_CLERK_PROXY_URL || undefined,
    //   appearance: {
    //     variables: {
    //       colorPrimary: '#c41e3a',
    //       colorBackground: '#000000',
    //       colorInputBackground: '#0a0a0a',
    //       colorText: '#f5f5f5',
    //       colorTextSecondary: '#666666',
    //       colorDanger: '#ff3366',
    //       colorSuccess: '#00ff88',
    //       borderRadius: '0px',
    //       fontFamily: 'inherit',
    //     },
    //   },
    // }),
  ],
  adapter: vercel(),
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
  },
});
