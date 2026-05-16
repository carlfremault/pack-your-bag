import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { updatePassword } from '@/features/auth/api';
import { updatePasswordSchema } from '@/features/auth/schema';
import { ApiError } from '@/lib/errors';
import { createRouteSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const raw = {
    currentPassword: formData.get('currentPassword') as string | null,
    newPassword: formData.get('newPassword') as string | null,
    confirmPassword: formData.get('confirmPassword') as string | null,
  };

  const parsed = updatePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const url = new URL('/settings', request.url);
    url.searchParams.set('error', parsed.error.issues[0]?.message ?? 'Validation failed');
    return NextResponse.redirect(url, 303);
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const data = await updatePassword({ currentPassword, newPassword });

    const successUrl = new URL('/settings', request.url);
    successUrl.searchParams.set('success', 'true');
    const response = NextResponse.redirect(successUrl, 303);
    await createRouteSession(request, response, data);
    revalidatePath('/settings');
    return response;
  } catch (e) {
    const errorUrl = new URL('/settings', request.url);
    errorUrl.searchParams.set('error', e instanceof ApiError ? e.message : 'Something went wrong');
    return NextResponse.redirect(errorUrl, 303);
  }
}
