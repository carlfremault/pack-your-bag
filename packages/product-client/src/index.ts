import createClient from 'openapi-fetch';
import type { paths } from './schema';

const baseUrl = process.env.PRODUCT_SERVICE_URL;
if (!baseUrl) {
  throw new Error('PRODUCT_SERVICE_URL environment variable is required');
}

export const productClient = createClient<paths>({
  baseUrl,
});

export type { paths } from './schema';
