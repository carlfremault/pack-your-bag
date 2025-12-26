import { getNestJsConfig } from '@repo/eslint-config/nest-js';

const nestJsConfig = getNestJsConfig(import.meta.dirname);

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  ...nestJsConfig,
];
