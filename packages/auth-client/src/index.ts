import createClient from 'openapi-fetch';
import type { paths } from './schema';

const baseUrl = process.env.AUTH_SERVICE_URL;
if (!baseUrl) {
  throw new Error('AUTH_SERVICE_URL environment variable is required');
}

export const authClient = createClient<paths>({
  baseUrl,
});

export type { paths } from './schema';
