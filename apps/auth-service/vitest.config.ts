import { nestjsConfig } from '@repo/vitest-config/nestjs';

import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nestjsConfig,
  defineConfig({
    test: {
      fileParallelism: false, // Disabled due to shared database state between tests
      setupFiles: ['./test/vitest-setup.ts'],
      coverage: {
        exclude: [
          '**/generated/**',
          '**/index.ts',
          '**/*.module.ts',
          '**/*.d.ts',
          '**/*.dto.ts',
          '**/*.interface.ts',
          'src/main.ts',
          'src/instrument.ts',
        ],
      },
    },
  }),
);
