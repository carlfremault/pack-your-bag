import type { paths } from '@repo/product-client';

import { headers } from 'next/headers';
import createClient from 'openapi-fetch';

import { INTERNAL_TOKEN_HEADER } from '@/proxy';

import { ApiError, SESSION_EXPIRED_MESSAGE } from '../errors';

interface ProductConfig {
  bffSecret: string;
  productServiceUrl: string;
}

const productConfig: ProductConfig = {
  bffSecret: process.env.BFF_SHARED_SECRET!,
  productServiceUrl: process.env.PRODUCT_SERVICE_URL!,
};

if (!productConfig.bffSecret) {
  throw new Error('BFF_SHARED_SECRET environment variable is required');
}

if (!productConfig.productServiceUrl) {
  throw new Error('PRODUCT_SERVICE_URL environment variable is required');
}

export async function getProductClient() {
  const headersList = await headers();
  const accessToken = headersList.get(INTERNAL_TOKEN_HEADER);

  if (!accessToken) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);

  const client = createClient<paths>({ baseUrl: productConfig.productServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
      request.headers.set('x-bff-secret', productConfig.bffSecret);
      return request;
    },
  });
  return client;
}
