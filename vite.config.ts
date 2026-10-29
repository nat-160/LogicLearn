/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base + hash routing = the same build works on GitHub Pages
  // (https://nat-160.github.io/LogicLearn/), a custom domain, or any static host.
  base: './',
  plugins: [react()],
  test: {
    // Simulation tests run in plain Node; UI tests opt into jsdom with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
});
