import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1',
    port: 4785,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4785,
    strictPort: true,
  },
  build: {
    target: 'safari15',
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    css: true,
    restoreMocks: true,
  },
});
