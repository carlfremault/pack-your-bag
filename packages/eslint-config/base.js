import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import onlyWarn from 'eslint-plugin-only-warn';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @param {string} appDir
 * @returns {import("typescript-eslint").ConfigArray}
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
      plugins: { 'simple-import-sort': simpleImportSort },
      rules: {
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              // 1. Sentry / Instrumentation MUST be first
              ['^\\u0000./instrument'],

              // 2. External packages: React/NestJS
              ['^react', '^@nestjs'],

              // 3. Monorepo Workspace (@repo/...)
              ['^@repo/'],

              // 4. All External packages
              ['^@?\\w'],

              // 5. Internal Aliases & Absolute imports
              ['^@/', '^(@|src|app|modules|components|hooks|utils|services|prisma)(/.*|$)'],

              // 6. Parent imports (../)
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

              // 7. Relative imports (./)
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

              // 8. Side effect & Style imports
              ['^\\u0000', '^.+\\.s?css$'],
            ],
          },
        ],
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
      ignores: ['dist/**', '**/generated/prisma/**'],
    },
  );
