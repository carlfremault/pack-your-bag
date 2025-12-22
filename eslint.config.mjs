import { config as baseConfig } from './packages/eslint-config/base.js';

export default [
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
  ...baseConfig,
];
