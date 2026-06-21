import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@motarjim/shared/diagnostics.js', replacement: resolve(__dirname, 'packages/shared/diagnostics.ts') },
      { find: '@motarjim/semantic-analyzer/ai', replacement: resolve(__dirname, 'packages/semantic-analyzer/ai.ts') },
      { find: '@motarjim/shared', replacement: resolve(__dirname, 'packages/shared/index.ts') },
      { find: '@motarjim/parser', replacement: resolve(__dirname, 'packages/parser/index.ts') },
      { find: '@motarjim/css-analyzer', replacement: resolve(__dirname, 'packages/css-analyzer/index.ts') },
      { find: '@motarjim/semantic-analyzer', replacement: resolve(__dirname, 'packages/semantic-analyzer/index.ts') },
      { find: '@motarjim/ir', replacement: resolve(__dirname, 'packages/ir/index.ts') },
      { find: '@motarjim/optimizer', replacement: resolve(__dirname, 'packages/optimizer/index.ts') },
      { find: '@motarjim/generator-flutter', replacement: resolve(__dirname, 'packages/generators/flutter/index.ts') },
      { find: '@motarjim/generator-compose', replacement: resolve(__dirname, 'packages/generators/compose/index.ts') },
      { find: '@motarjim/generator-core', replacement: resolve(__dirname, 'packages/generator-core/index.ts') },
      { find: '@motarjim/generator-swiftui', replacement: resolve(__dirname, 'packages/generators/swiftui/index.ts') },
      { find: '@motarjim/cli', replacement: resolve(__dirname, 'packages/cli/index.ts') },
    ],
  },
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
