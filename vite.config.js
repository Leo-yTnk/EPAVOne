import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: '/EPAVOne/',
  plugins: [preact()],
  server: { allowedHosts: ['terminal.local'] },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js'
  }
});
