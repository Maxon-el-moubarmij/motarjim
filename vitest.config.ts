import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
      include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    },
  },
});
