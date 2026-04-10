import { postToAuthService } from './auth-http';

export async function verifyEmail(
  token: string,
): Promise<{ success: boolean; formError?: string }> {
  if (!token || token.trim().length === 0) {
    return { success: false, formError: 'Invalid verification token' };
  }

  const result = await postToAuthService('/auth/verify-email', { token }, { token });

  if (!result.ok)
    return { success: false, formError: result.error?.formError ?? 'Verification failed' };

  return { success: true };
}
