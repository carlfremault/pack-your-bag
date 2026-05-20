import {
  getAccessTokenAuthClient,
  getPublicAuthClient,
  getRefreshTokenAuthClient,
} from '@/lib/clients/auth-client';
import { ApiError } from '@/lib/errors';
import { extractErrorMessage, extractErrorType } from '@/utils/extractApiErrorDetails';

import { AuthApiError } from './errors';
import {
  CancelDeletionBody,
  DeleteAccountBody,
  LoginBody,
  LoginResponse,
  PasswordForgottenBody,
  RegisterBody,
  ResendVerificationEmailBody,
  ResetPasswordBody,
  UpdatePasswordBody,
  VerifyEmailBody,
} from './types';

export async function createGuestSession(): Promise<LoginResponse> {
  const authClient = await getPublicAuthClient();

  const { data, error, response } = await authClient
    .POST('/auth/guest-session', {
      signal: AbortSignal.timeout(15000),
    })
    .catch(throwServiceUnavailable);

  if (!response.ok) {
    throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
  }
  if (!data) throw new ApiError('No data returned', 500);
  return data as LoginResponse;
}

export async function login(body: LoginBody): Promise<LoginResponse> {
  const authClient = await getPublicAuthClient();

  const { data, error, response } = await authClient
    .POST('/auth/login', {
      body,
      signal: AbortSignal.timeout(10000),
    })
    .catch(throwServiceUnavailable);

  if (!response.ok) {
    throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
  }
  if (!data) throw new ApiError('No data returned', 500);
  return data;
}

export async function logout(): Promise<void> {
  const authClient = await getRefreshTokenAuthClient();
  await authClient.DELETE('/auth/logout');
}

export async function logoutAll(): Promise<void> {
  const authClient = await getAccessTokenAuthClient();
  await authClient.DELETE('/auth/logout-all');
}

export async function register(body: RegisterBody): Promise<void> {
  await postPublicAuthRequest('/auth/register', body);
}

export async function passwordForgotten(body: PasswordForgottenBody): Promise<void> {
  await postPublicAuthRequest('/auth/forgot-password', body);
}

export async function resendVerificationEmail(body: ResendVerificationEmailBody): Promise<void> {
  await postPublicAuthRequest('/auth/resend-verification-email', body);
}

export async function verifyEmail(body: VerifyEmailBody): Promise<void> {
  await postPublicAuthRequest('/auth/verify-email', body);
}

export async function resetPassword(body: ResetPasswordBody): Promise<void> {
  await postPublicAuthRequest('/auth/reset-password', body);
}

export async function updatePassword(body: UpdatePasswordBody): Promise<LoginResponse> {
  const authClient = await getAccessTokenAuthClient();

  const { data, error, response } = await authClient
    .PATCH('/auth/update-password', {
      body,
      signal: AbortSignal.timeout(10000),
    })
    .catch(throwServiceUnavailable);

  if (!response.ok) {
    throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
  }
  if (!data) throw new ApiError('No data returned', 500);
  return data as LoginResponse;
}

export async function deleteAccount(body: DeleteAccountBody): Promise<void> {
  const authClient = await getAccessTokenAuthClient();

  const { error, response } = await authClient
    .POST('/user/delete', {
      body,
      signal: AbortSignal.timeout(10000),
    })
    .catch(throwServiceUnavailable);

  if (!response.ok) {
    throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
  }
}

export async function cancelDeletion(body: CancelDeletionBody): Promise<void> {
  await postPublicAuthRequest('/user/cancel-deletion', body);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function throwServiceUnavailable(e: unknown): never {
  console.error('[auth-api] fetch rejected:', e);
  throw new ApiError('Authentication service unavailable', 503);
}

type PublicAuthRequestEndpoints =
  | '/auth/register'
  | '/auth/forgot-password'
  | '/auth/resend-verification-email'
  | '/auth/verify-email'
  | '/auth/reset-password'
  | '/user/cancel-deletion';

type PublicAuthRequestBody =
  | RegisterBody
  | PasswordForgottenBody
  | ResendVerificationEmailBody
  | VerifyEmailBody
  | ResetPasswordBody
  | CancelDeletionBody;

async function postPublicAuthRequest(
  endpoint: PublicAuthRequestEndpoints,
  body: PublicAuthRequestBody,
): Promise<void> {
  const authClient = await getPublicAuthClient();

  const { error, response } = await authClient
    .POST(endpoint, {
      body,
      signal: AbortSignal.timeout(10000),
    })
    .catch(throwServiceUnavailable);

  if (!response.ok) {
    throw new AuthApiError(extractErrorMessage(error), response.status, extractErrorType(error));
  }
}
