import type { paths } from '@repo/auth-client';

import createClient from 'openapi-fetch';

import { auth } from '../auth';
import { ApiError } from '../errors';

interface AuthConfig {
  bffSecret: string;
  authServiceUrl: string;
}

const authConfig: AuthConfig = {
  bffSecret: process.env.BFF_SHARED_SECRET!,
  authServiceUrl: process.env.AUTH_SERVICE_URL!,
};

if (!authConfig.bffSecret) {
  throw new Error('BFF_SHARED_SECRET environment variable is required');
}

if (!authConfig.authServiceUrl) {
  throw new Error('AUTH_SERVICE_URL environment variable is required');
}

// For register, forgot password — no session needed
export function getPublicAuthClient() {
  const client = createClient<paths>({ baseUrl: authConfig.authServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('x-bff-secret', authConfig.bffSecret);
      return request;
    },
  });
  return client;
}

// For change password, logout — session required
export async function getAuthClient() {
  const session = await auth();
  if (!session?.accessToken) throw new ApiError('Unauthorized', 401);

  const client = createClient<paths>({ baseUrl: authConfig.authServiceUrl });
  client.use({
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${session.accessToken}`);
      request.headers.set('x-bff-secret', authConfig.bffSecret);
      return request;
    },
  });
  return client;
}
