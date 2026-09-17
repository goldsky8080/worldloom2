import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  cacheDir: process.env.WORLDLOOM_VITE_CACHE_DIR ?? '.cache/vite-dev',
  server: {
    port: 5190,
    strictPort: true,
    watch: {
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
      ignored: ['**/playwright-report/**', '**/test-results/**', '**/docs/screenshots/**'],
    },
  },
  preview: { port: 5191, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { pixi: ['pixi.js'], react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
