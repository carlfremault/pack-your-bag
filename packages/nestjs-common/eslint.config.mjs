import { getNestJsConfig } from '@repo/eslint-config/nest-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  ...getNestJsConfig(import.meta.dirname),
];
