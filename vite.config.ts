import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  cacheDir: '.vite-dev-cache',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { strictPort: true, port: 5173, allowedHosts: ['.trycloudflare.com'] },
  preview: { strictPort: true, port: 4173, allowedHosts: ['.trycloudflare.com'] },
  build: { rollupOptions: { output: { manualChunks: { 'motion-vendor': ['motion/react'], 'react-vendor': ['react', 'react-dom/client'] } } } },
});
