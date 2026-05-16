import { NextRequest, NextResponse } from 'next/server';

import { getIronSession } from 'iron-session';

import { register } from '@/features/auth/api';
import { registerSchema } from '@/features/auth/schema';
import { ApiError } from '@/lib/errors';
import { type SessionData, sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string) ?? '';

  const parsed = registerSchema.safeParse({ email, password, confirmPassword });
  if (!parsed.success) {
    const url = new URL('/register', request.url);
    url.searchParams.set('error', parsed.error.issues[0]?.message ?? 'Invalid input');
    return NextResponse.redirect(url, 303);
  }

  try {
    await register({ email: parsed.data.email, password: parsed.data.password });
  } catch (e) {
    const errorUrl = new URL('/register', request.url);
    errorUrl.searchParams.set('error', e instanceof ApiError ? e.message : 'Something went wrong');
    return NextResponse.redirect(errorUrl, 303);
  }

  const successUrl = new URL('/register-success', request.url);
  const response = NextResponse.redirect(successUrl, 303);
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.pendingVerificationEmail = parsed.data.email;
  await session.save();

  return response;
}
