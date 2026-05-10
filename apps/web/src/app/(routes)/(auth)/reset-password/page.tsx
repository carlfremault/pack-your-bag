import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { Alert } from '@repo/react-common/alert';
import { CenteredSurfaceCard } from '@repo/react-common/card';

import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { extractLocaleFromHeaders } from '@/utils/extractLocaleFromHeaders';

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

  const locale = extractLocaleFromHeaders(await headers());

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
