import { uiConfig } from '@repo/vitest-config/ui';

import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const sharedUiConfig = uiConfig as UserConfig & { test?: Record<string, unknown> };

export default defineConfig({
  ...sharedUiConfig,
  resolve: { tsconfigPaths: true },
  test: {
    ...sharedUiConfig.test,
    coverage: {
      ...sharedUiConfig.test?.coverage,
      provider: 'v8',
      exclude: ['src/app/**'],
      reporter: [['json', { file: 'coverage-node.json' }]],
      reportsDirectory: './coverage',
    },
    environment: 'node',
    passWithNoTests: true,
    include: ['**/*.test.ts'],
    setupFiles: ['tsconfig-paths/register'],
  },
});
