import { getPublicAuthClient, getRefreshTokenAuthClient } from '@/lib/clients/auth-client';
import { ApiError } from '@/lib/errors';
import { extractErrorMessage, extractErrorType } from '@/utils/extractApiErrorDetails';

import { AuthApiError } from './errors';
import {
  LoginBody,
  LoginResponse,
  PasswordForgottenBody,
  RegisterBody,
  ResendVerificationEmailBody,
  VerifyEmailBody,
} from './types';

export async function login(body: LoginBody): Promise<LoginResponse> {
  const authClient = await getPublicAuthClient();

  try {
    const { data, error, response } = await authClient.POST('/auth/login', {
      body,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
    }
    if (!data) throw new ApiError('No data returned', 500);
    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Authentication service unavailable', 503);
  }
}

export async function logout(): Promise<void> {
  const authClient = await getRefreshTokenAuthClient();
  await authClient.DELETE('/auth/logout');
}

export async function register(body: RegisterBody): Promise<void> {
  await postAuthRequest('/auth/register', body);
}

export async function passwordForgotten(body: PasswordForgottenBody): Promise<void> {
  await postAuthRequest('/auth/forgot-password', body);
}

export async function resendVerificationEmail(body: ResendVerificationEmailBody): Promise<void> {
  await postAuthRequest('/auth/resend-verification-email', body);
}

export async function verifyEmail(body: VerifyEmailBody): Promise<void> {
  await postAuthRequest('/auth/verify-email', body);
}

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

type AuthRequestEndpoints =
  | '/auth/register'
  | '/auth/forgot-password'
  | '/auth/resend-verification-email'
  | '/auth/verify-email';

type AuthRequestBody =
  | RegisterBody
  | PasswordForgottenBody
  | ResendVerificationEmailBody
  | VerifyEmailBody;

async function postAuthRequest(
  endpoint: AuthRequestEndpoints,
  body: AuthRequestBody,
): Promise<void> {
  const authClient = await getPublicAuthClient();

  try {
    const { error, response } = await authClient.POST(endpoint, {
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Authentication service unavailable', 503);
  }
}
