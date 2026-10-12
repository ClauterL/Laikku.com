import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Custom domain (laikku.com) on GitHub Pages → site lives at the root.
  base: '/',
  build: {
    target: 'es2022',
    cssMinify: true,
  },
})
