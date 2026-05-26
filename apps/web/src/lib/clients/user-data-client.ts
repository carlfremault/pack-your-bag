import { headers } from 'next/headers';

import type { paths } from '@repo/user-data-client';

import createClient from 'openapi-fetch';

import { INTERNAL_TOKEN_HEADER } from '@/proxy';

import { SESSION_EXPIRED_MESSAGE } from '../constants';
import { ApiError } from '../errors';

import { getUserDataConfig } from './user-data-config';

import 'server-only';

export async function getUserDataClient() {
  const { userDataServiceUrl, bffSecret } = getUserDataConfig();

  const headersList = await headers();
  const accessToken = headersList.get(INTERNAL_TOKEN_HEADER);
  const forwardedFor = headersList.get('x-forwarded-for');

  if (!accessToken) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);

  const client = createClient<paths>({
    baseUrl: userDataServiceUrl,
    credentials: 'omit',
    fetch: (input: Request) => fetch(input, { cache: 'no-store' }),
  });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
      request.headers.set('x-bff-secret', bffSecret);
      if (forwardedFor) request.headers.set('x-forwarded-for', forwardedFor);
      return request;
    },
  });
  return client;
}
