import { getNextJsConfig } from '@repo/eslint-config/next-js';

/** @type {Object[]} */
const config = getNextJsConfig(import.meta.dirname);

export default config;
