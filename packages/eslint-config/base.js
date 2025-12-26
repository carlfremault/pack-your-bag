import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type{import("typescript-eslint").ConfigArray}
 * @param {string} appDir
 * */
export const getBaseConfig = (appDir) =>
  defineConfig(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: appDir,
        },
      },
    },
    {
      plugins: {
        turbo: turboPlugin,
      },
      rules: {
        'turbo/no-undeclared-env-vars': 'warn',
      },
    },
    {
      plugins: {
        onlyWarn,
      },
    },
    {
      ignores: ['dist/**'],
    },
  );
