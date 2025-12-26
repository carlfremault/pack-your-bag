import { mergeConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { baseConfig } from './base-config.js';
import swc from 'unplugin-swc';

export const nestjsConfig = mergeConfig(baseConfig, {
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
    tsconfigPaths(),
  ],
});
