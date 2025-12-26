import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { getBaseConfig } from './base.js';

/**
 * A custom ESLint configuration for libraries that use Nest.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * @param {string} appDir
 * */
export const getNestJsConfig = (appDir) =>
  defineConfig(
    ...getBaseConfig(appDir),
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.vitest,
        },
        sourceType: 'module',
      },
    },
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
