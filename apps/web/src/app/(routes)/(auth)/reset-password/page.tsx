import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton } from '@repo/react-common/button';
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
  const error = typeof params.error === 'string' ? params.error : undefined;
  const success = params.success === 'true';

  const locale = extractLocaleFromHeaders(await headers());

  if (success) {
    return (
      <CenteredSurfaceCard title="Reset password">
        <div className="flex flex-col gap-4">
          <Alert type="success" message="Your password has been reset. You can now sign in." />
          <LinkButton href="/login" variant="outline" linkAs={Link} className="self-end">
            Back to login
          </LinkButton>
        </div>
      </CenteredSurfaceCard>
    );
  }

  if (!token || typeof token !== 'string') {
    return (
      <CenteredSurfaceCard>
        <Alert type="error" message="Something went wrong. Please try again." />
      </CenteredSurfaceCard>
    );
  }

  return (
    <CenteredSurfaceCard title="Reset password">
      <ResetPasswordForm token={token} locale={locale} error={error} />
    </CenteredSurfaceCard>
  );
}
