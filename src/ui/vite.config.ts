import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    svelte(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist-ui'),
    emptyOutDir: true,
    target: 'esnext',
  },
});
