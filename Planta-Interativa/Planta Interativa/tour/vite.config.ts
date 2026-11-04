/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets PAGES_BASE. Locally it stays at /.
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
  build: {
    // The lazily loaded 3D chunk (three.js, drei, post-processing) is ~1.6 MB raw / ~550 kB gzip by nature.
    chunkSizeWarningLimit: 1800,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/inquiry/**', 'src/state/**', 'src/data/**', 'src/ui/**'],
      exclude: ['**/*.test.*'],
    },
  },
})
