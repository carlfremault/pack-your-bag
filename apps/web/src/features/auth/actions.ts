'use server';

import { redirect } from 'next/navigation';

import { getAuthConfig } from '@/lib/auth-config';
import { getSession } from '@/lib/session';

import { loginSchema } from './components/schema';

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

  const { authServiceUrl, bffSecret } = getAuthConfig();

  let res: Response;
  try {
    res = await fetch(`${authServiceUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-secret': bffSecret,
      },
      body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
    });
  } catch {
    return { formError: 'Authentication service unavailable', values };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return {
      formError: (body.message as string | undefined) ?? 'Invalid email or password',
      values,
    };
  }

  const body = await res.json();

  const session = await getSession();
  session.isLoggedIn = true;
  session.userId = body.user.id as string;
  session.role = body.user.role as number;
  session.accessToken = body.access_token as string;
  session.refreshToken = body.refresh_token as string;
  session.accessTokenExpiresAt = Math.floor(Date.now() / 1000) + (body.expires_in as number);
  await session.save();

  redirect('/items');
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
