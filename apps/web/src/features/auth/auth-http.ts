import { getAuthConfig } from '@/lib/auth-config';

import { FormError, FormValues } from './types';

type PostResult = { ok: true; body: unknown } | { ok: false; error: FormError };

export async function postToAuthService(
  endpoint: string,
  payload: Record<string, string>,
  values: FormValues,
  fallbackError = 'Something went wrong',
): Promise<PostResult> {
  const { authServiceUrl, bffSecret } = getAuthConfig();

  let res: Response;
  try {
    res = await fetch(`${authServiceUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-secret': bffSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { ok: false, error: { formError: 'Authentication service unavailable', values } };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: {
        formError: (body.message as string | undefined) ?? fallbackError,
        errorCode: body.error as string | undefined,
        values,
      },
    };
  }

  const body: unknown = await res.json().catch(() => null);
  return { ok: true, body };
}
