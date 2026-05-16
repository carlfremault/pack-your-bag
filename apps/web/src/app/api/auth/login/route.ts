import { NextRequest, NextResponse } from 'next/server';

import { getIronSession } from 'iron-session';

import { login } from '@/features/auth/api';
import { AuthApiError } from '@/features/auth/errors';
import { loginSchema } from '@/features/auth/schema';
import { ApiError } from '@/lib/errors';
import { createRouteSession, type SessionData, sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  console.log('--- API ROUTE HIT ---');
  const formData = await request.formData();
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';

  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', parsed.error.issues[0]?.message ?? 'Invalid input');
    return NextResponse.redirect(url, 303);
  }

  try {
    const data = await login(parsed.data);

    const successUrl = new URL('/items', request.url);
    const response = NextResponse.redirect(successUrl, 303);
    await createRouteSession(request, response, data);
    return response;
  } catch (e) {
    if (e instanceof AuthApiError && e.errorCode === 'EMAIL_NOT_VERIFIED') {
      const verifyUrl = new URL('/email-not-verified', request.url);
      const response = NextResponse.redirect(verifyUrl, 303);
      const session = await getIronSession<SessionData>(request, response, sessionOptions);
      session.pendingVerificationEmail = email || undefined;
      await session.save();
      return response;
    }

    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', e instanceof ApiError ? e.message : 'Something went wrong');
    return NextResponse.redirect(errorUrl, 303);
  }
}
