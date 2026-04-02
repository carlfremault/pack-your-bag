import { getReactInternalConfig } from '@repo/eslint-config/react-internal';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.storybook/**',
      'eslint.config.mjs',
      'vitest.config.ts',
      'vitest.shims.d.ts',
      'storybook-static/**',
    ],
  },
  ...getReactInternalConfig(import.meta.dirname),
];
