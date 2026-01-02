import { uiConfig } from '@repo/vitest-config/ui';

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...uiConfig,
  plugins: [react(), tsconfigPaths()],
  test: {
    ...uiConfig.test,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
    coverage: {
      ...uiConfig.test.coverage,
      provider: 'istanbul',
      reporter: [['json', { file: 'coverage-browser.json' }]],
      reportsDirectory: './coverage',
    },
    include: ['**/*.browser.test.tsx'],
  },
});
