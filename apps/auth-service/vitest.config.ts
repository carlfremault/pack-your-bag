import { nestjsConfig } from '@repo/vitest-config/nestjs';

import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nestjsConfig,
  defineConfig({
    test: {
      fileParallelism: false, // Disabled due to shared database state between tests
      setupFiles: ['./test/vitest-setup.ts'],
      coverage: {
        exclude: ['**/generated/**'],
      },
    },
  }),
);
