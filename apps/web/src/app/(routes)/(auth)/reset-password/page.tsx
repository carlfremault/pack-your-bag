import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { Alert } from '@repo/react-common/alert';
import { CenteredSurfaceCard } from '@repo/react-common/card';

import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Reset a forgotten password.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = params.token;

  const rawLocale = (await headers()).get('accept-language')?.split(',')[0]?.split(';')[0]?.trim();
  const locale = rawLocale?.split('-').slice(0, 2).join('-');

  if (!token || typeof token !== 'string') {
    return (
      <CenteredSurfaceCard>
        <Alert type="error" message="Something went wrong. Please try again." />
      </CenteredSurfaceCard>
    );
  }

  return (
    <CenteredSurfaceCard title="Reset password">
      <ResetPasswordForm token={token} locale={locale} />
    </CenteredSurfaceCard>
  );
}
