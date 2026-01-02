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
              // 1. External packages: React/NestJS
              ['^react', '^@nestjs'],

              // 2. Monorepo Workspace (@repo/...)
              ['^@repo/'],

              // 3. ALL External packages (vitest, lodash, @prisma, @anything)
              // This catches everything from node_modules automatically.
              ['^@?\\w'],

              // 4. Internal Aliases & Absolute imports
              // By using the slash ^@/ we distinguish your code from npm @packages.
              ['^@/', '^(@|src|app|modules|components|hooks|utils|services|prisma)(/.*|$)'],

              // 5. Parent imports (../)
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

              // 6. Relative imports (./)
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

              // 7. Side effect & Style imports
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
