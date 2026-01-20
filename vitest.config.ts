import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [],
  esbuild: {
    // Avoid "React is not defined" in tests by using the automatic JSX runtime
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/app/api/**', 'src/server/**'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/types/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // Next.js uses this marker module in server-only files; stub it for Vitest.
      'server-only': resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});
