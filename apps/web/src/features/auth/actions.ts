'use server';

import { redirect } from 'next/navigation';

import { ApiError } from '@/lib/errors';
import { getSession } from '@/lib/session';

import { login, logout, passwordForgotten, register, resendVerificationEmail } from './api';
import { AuthApiError } from './errors';
import {
  loginSchema,
  passwordForgottenSchema,
  registerSchema,
  resendVerificationEmailSchema,
} from './schema';
import { LoginResponse } from './types';

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function createSessionFromLoginResponse(response: LoginResponse): Promise<void> {
  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = response.user.id;
  session.role = response.user.role;
  session.accessToken = response.access_token;
  session.refreshToken = response.refresh_token;
  session.accessTokenExpiresAt = Math.floor(Date.now() / 1000) + response.expires_in;
  session.pendingVerificationEmail = undefined;
  await session.save();
}

// ============================================
// LOGIN
// ============================================

export type LoginState = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  formError?: string;
  values?: {
    email?: string;
  };
} | null;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: formData.get('email') as string | null,
    password: formData.get('password') as string | null,
  };
  const values = { email: raw.email ?? '' };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<LoginState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email' || field === 'password') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  try {
    const data = await login(parsed.data);
    await createSessionFromLoginResponse(data);
  } catch (e) {
    if (e instanceof AuthApiError && e.errorCode === 'EMAIL_NOT_VERIFIED') {
      const session = await getSession();
      session.pendingVerificationEmail = values.email || undefined;
      await session.save();
      redirect('/email-not-verified');
    }
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  redirect('/items');
}

// ============================================
// LOGOUT
// ============================================

export async function logoutAction() {
  const session = await getSession();

  if (session.isLoggedIn && session.refreshToken) {
    try {
      await logout();
    } catch {
      // Best-effort: destroy the local session regardless of the upstream call
    }
  }

  session.destroy();
  redirect('/login');
}

// ============================================
// REGISTER
// ============================================

export type RegisterState = {
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  formError?: string;
  values?: {
    email?: string;
  };
} | null;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    email: formData.get('email') as string | null,
    password: formData.get('password') as string | null,
    confirmPassword: formData.get('confirmPassword') as string | null,
  };
  const values = { email: raw.email ?? '' };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<RegisterState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email' || field === 'password' || field === 'confirmPassword') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  const { email, password } = parsed.data;

  try {
    await register({ email, password });
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  const session = await getSession();
  session.pendingVerificationEmail = parsed.data.email;
  await session.save();

  redirect('/register-success');
}

// ============================================
// PASSWORD RESET
// ============================================

export type PasswordForgottenState = {
  fieldErrors?: {
    email?: string;
  };
  formError?: string;
  success?: boolean;
  values?: {
    email?: string;
  };
} | null;

export async function passwordForgottenAction(
  _prevState: PasswordForgottenState,
  formData: FormData,
): Promise<PasswordForgottenState> {
  const raw = { email: formData.get('email') as string | null };
  const values = { email: raw.email ?? '' };

  const parsed = passwordForgottenSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<PasswordForgottenState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  try {
    await passwordForgotten(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  return { success: true };
}

// ============================================
// EMAIL VERIFICATION
// ============================================

export type ResendVerificationEmailState = {
  fieldErrors?: {
    email?: string;
  };
  formError?: string;
  success?: boolean;
  values?: {
    email?: string;
  };
} | null;

export async function resendVerificationEmailAction(
  _prevState: ResendVerificationEmailState,
  formData: FormData,
): Promise<ResendVerificationEmailState> {
  const raw = { email: formData.get('email') as string | null };
  const values = { email: raw.email ?? '' };

  const parsed = resendVerificationEmailSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<ResendVerificationEmailState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  try {
    await resendVerificationEmail(parsed.data);
  } catch (e) {
    return { formError: e instanceof ApiError ? e.message : 'Something went wrong', values };
  }

  const session = await getSession();
  session.pendingVerificationEmail = undefined;
  await session.save();

  return { success: true };
}
