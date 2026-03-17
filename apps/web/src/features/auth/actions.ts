'use server';

import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';

export async function logoutAction() {
  const session = await getSession();

  if (session.isLoggedIn && session.refreshToken) {
    try {
      await fetch(`${process.env.AUTH_SERVICE_URL}/auth/logout`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.refreshToken}`,
          'x-bff-secret': process.env.BFF_SHARED_SECRET!,
        },
      });
    } catch {
      // Best-effort: destroy the local session regardless of the upstream call
    }
  }

  session.destroy();
  redirect('/login');
}
