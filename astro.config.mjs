// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  // Site statique par défaut. L’adaptateur Node ne sert qu’aux
  // endpoints /api/bible/* (prerender = false) utilisés par le comparateur.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  image: {
    domains: ["api.literae.ch"],
    remotePatterns: [{ protocol: "https", hostname: "api.literae.ch" }],
  },
  vite: {
    plugins: [tailwindcss()],
	server: {
      watch: {
        ignored: [
          '**/data/**',
          '**/*.db',
          '**/*.db-wal',
          '**/*.db-shm',
          '**/*.db-journal'
        ]
      }
    }
  }
});