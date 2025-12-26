import { nestjsConfig } from '@repo/vitest-config/nestjs';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  nestjsConfig,
  defineConfig({
    test: {
      setupFiles: ['./test/vitest-setup.ts'],
    },
  }),
);
