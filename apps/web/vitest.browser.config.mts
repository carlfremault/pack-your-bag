import { uiConfig } from '@repo/vitest-config/ui';

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vitest/config';

const sharedUiConfig = uiConfig as UserConfig & { test?: Record<string, unknown> };

export default defineConfig({
  ...sharedUiConfig,
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    ...sharedUiConfig.test,
    browser: {
      enabled: true,
      provider: playwright() as never,
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      provider: 'istanbul',
      reporter: [['json', { file: 'coverage-browser.json' }]],
      reportsDirectory: './coverage',
    },
    include: ['**/*.browser.test.tsx'],
  },
});
