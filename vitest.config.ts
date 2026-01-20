import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
      'server-only': resolve(__dirname, './src/test/mocks/server-only.ts'),
    },
  },
});
