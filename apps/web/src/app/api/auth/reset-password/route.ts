import { NextRequest, NextResponse } from 'next/server';

import { resetPassword } from '@/features/auth/api';
import { resetPasswordSchema } from '@/features/auth/schema';
import { ApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = (formData.get('token') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string) ?? '';
  const locale = (formData.get('locale') as string) || undefined;

  const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
  if (!parsed.success) {
    const url = new URL('/reset-password', request.url);
    url.searchParams.set('token', token);
    url.searchParams.set('error', parsed.error.issues[0]?.message ?? 'Invalid input');
    return NextResponse.redirect(url, 303);
  }

  try {
    await resetPassword({ token: parsed.data.token, password: parsed.data.password, locale });
  } catch (e) {
    const url = new URL('/reset-password', request.url);
    url.searchParams.set('token', token);
    url.searchParams.set('error', e instanceof ApiError ? e.message : 'Something went wrong');
    return NextResponse.redirect(url, 303);
  }

  const successUrl = new URL('/reset-password', request.url);
  successUrl.searchParams.set('success', 'true');
  return NextResponse.redirect(successUrl, 303);
}
