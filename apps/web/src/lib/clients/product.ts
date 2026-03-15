import type { paths } from '@repo/product-client';

import createClient from 'openapi-fetch';

import { auth } from '../auth';
import { ApiError } from '../errors';

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
  // called per-request, no caching — session is always fresh
  const session = await auth();
  if (!session?.accessToken) throw new ApiError('Unauthorized', 401);

  const client = createClient<paths>({ baseUrl: productConfig.productServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${session.accessToken}`);
      request.headers.set('x-bff-secret', productConfig.bffSecret);
      return request;
    },
  });
  return client;
}
