import { ApiError } from '@/lib/errors';

import { verifyEmail } from './api';

export async function verifyEmailToken(
  token: string,
): Promise<{ success: boolean; formError?: string }> {
  if (!token || token.trim().length === 0) {
    return { success: false, formError: 'Invalid verification token' };
  }

  try {
    await verifyEmail({ token });
  } catch (e) {
    return { success: false, formError: e instanceof ApiError ? e.message : 'Verification failed' };
  }

  return { success: true };
}
