import { headers } from 'next/headers';

import type { paths } from '@repo/auth-client';

import createClient from 'openapi-fetch';

import { INTERNAL_TOKEN_HEADER } from '@/proxy';

import { SESSION_EXPIRED_MESSAGE } from '../constants';
import { ApiError } from '../errors';
import { getSession } from '../session';

import { getAuthConfig } from './auth-config';

import 'server-only';

export async function getPublicAuthClient() {
  const { authServiceUrl, bffSecret } = getAuthConfig();

  const client = createClient<paths>({ baseUrl: authServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('x-bff-secret', bffSecret);
      return request;
    },
  });
  return client;
}

export async function getRefreshTokenAuthClient() {
  const session = await getSession();

  if (session.isLoggedIn && session.refreshToken) {
    const { authServiceUrl, bffSecret } = getAuthConfig();
    const client = createClient<paths>({ baseUrl: authServiceUrl });
    client.use({
      async onRequest({ request }) {
        request.headers.set('Authorization', `Bearer ${session.refreshToken}`);
        request.headers.set('x-bff-secret', bffSecret);
        return request;
      },
    });
    return client;
  } else {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);
  }
}

export async function getAccessTokenAuthClient() {
  const { authServiceUrl, bffSecret } = getAuthConfig();

  const headersList = await headers();
  const accessToken = headersList.get(INTERNAL_TOKEN_HEADER);

  if (!accessToken) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401);

  const client = createClient<paths>({ baseUrl: authServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${accessToken}`);
      request.headers.set('x-bff-secret', bffSecret);
      return request;
    },
  });
  return client;
}
