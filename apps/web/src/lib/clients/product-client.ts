import { headers } from 'next/headers';

import type { paths } from '@repo/product-client';

import createClient from 'openapi-fetch';

import { INTERNAL_TOKEN_HEADER } from '@/proxy';

import { SESSION_EXPIRED_MESSAGE } from '../constants';
import { ApiError } from '../errors';

import { getProductConfig } from './product-config';

import 'server-only';

export async function getProductClient() {
  const { productServiceUrl, bffSecret } = getProductConfig();

  const headersList = await headers();
  const accessToken = headersList.get(INTERNAL_TOKEN_HEADER);

  if (!accessToken) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);

  const client = createClient<paths>({
    baseUrl: productServiceUrl,
    fetch: (input: Request) => fetch(new Request(input, { cache: 'no-store' })),
  });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
      request.headers.set('x-bff-secret', bffSecret);
      return request;
    },
  });
  return client;
}
