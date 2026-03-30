import { mergeConfig } from 'vitest/config';
import { baseConfig } from './base-config.js';
import swc from 'unplugin-swc';
import path from 'node:path';

export const nestjsConfig = mergeConfig(baseConfig, {
  oxc: false,
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: [['json', { file: 'coverage-node.json' }], 'text', 'html'],
      reportsDirectory: './coverage',
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
