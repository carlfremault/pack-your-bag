'use server';

import { redirect } from 'next/navigation';

import { getAuthConfig } from '@/lib/auth-config';
import { getSession } from '@/lib/session';

import { loginSchema, passwordResetSchema, registerSchema } from './schema';

type FormValues = { email: string };

type FormError = {
  formError: string;
  values: FormValues;
};

type PostResult = { ok: true; body: unknown } | { ok: false; error: FormError };

async function postToAuthService(
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
        values,
      },
    };
  }

  const body: unknown = await res.json().catch(() => null);
  return { ok: true, body };
}

async function authenticateAndCreateSession(
  endpoint: string,
  credentials: Record<string, string>,
  values: FormValues,
): Promise<FormError> {
  const result = await postToAuthService(
    endpoint,
    credentials,
    values,
    'Invalid email or password',
  );

  if (!result.ok) return result.error;

  const body = result.body as {
    user: { id: string; role: number };
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = body.user.id;
  session.role = body.user.role;
  session.accessToken = body.access_token;
  session.refreshToken = body.refresh_token;
  session.accessTokenExpiresAt = Math.floor(Date.now() / 1000) + body.expires_in;
  await session.save();

  redirect('/items');
}

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

  return authenticateAndCreateSession('/auth/login', parsed.data, values);
}

export async function logoutAction() {
  const session = await getSession();

  if (session.isLoggedIn && session.refreshToken) {
    const { authServiceUrl, bffSecret } = getAuthConfig();
    try {
      await fetch(`${authServiceUrl}/auth/logout`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.refreshToken}`,
          'x-bff-secret': bffSecret,
        },
      });
    } catch {
      // Best-effort: destroy the local session regardless of the upstream call
    }
  }

  session.destroy();
  redirect('/login');
}

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
  return authenticateAndCreateSession('/auth/register', { email, password }, values);
}

export type PasswordResetState = {
  fieldErrors?: {
    email?: string;
  };
  formError?: string;
  success?: boolean;
  values?: {
    email?: string;
  };
} | null;

export async function passwordResetAction(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const raw = {
    email: formData.get('email') as string | null,
  };
  const values = { email: raw.email ?? '' };

  const parsed = passwordResetSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: NonNullable<PasswordResetState>['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === 'email') {
        fieldErrors[field] ??= issue.message;
      }
    }
    return { fieldErrors, values };
  }

  const result = await postToAuthService('/auth/forgot-password', parsed.data, values);

  if (!result.ok) return result.error;

  return { success: true };
}
