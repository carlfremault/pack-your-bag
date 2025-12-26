import { getNextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [...getNextJsConfig(import.meta.dirname)];
