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

export type SuccessResponse<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  responses: { 200: { content: { 'application/json': infer R } } };
}
  ? R
  : paths[P][M] extends { responses: { 201: { content: { 'application/json': infer R } } } }
    ? R
    : never;

export type RequestBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  requestBody: { content: { 'application/json': infer R } };
}
  ? R
  : never;
