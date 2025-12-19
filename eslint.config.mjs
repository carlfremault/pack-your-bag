import { config as baseConfig } from './packages/eslint-config/base.js';

export default [
  ...baseConfig,
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      'package.json',
      'turbo.json',
    ],
  },
];
