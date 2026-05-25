import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert } from '@repo/react-common/alert';
import { LinkButton } from '@repo/react-common/button';
import { CenteredSurfaceCard } from '@repo/react-common/card';

import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';
import { verifyEmailToken } from '@/features/auth/queries';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Email verification',
  description: 'Verify your email address to complete your registration.',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token || typeof token !== 'string') {
    return (
      <CenteredSurfaceCard>
        <Alert type="error" message="Something went wrong. Please try again." />
      </CenteredSurfaceCard>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.success) {
    if (result.errorCode === 'EMAIL_ALREADY_VERIFIED') {
      return (
        <CenteredSurfaceCard title="Already verified">
          <Alert type="success" message="This email address has already been verified." />
          <LinkButton href="/login" variant="outline" linkAs={Link}>
            Back to login
          </LinkButton>
        </CenteredSurfaceCard>
      );
    }

    const session = await getSession();
    const prefillEmail = session.pendingVerificationEmail ?? undefined;

    return (
      <CenteredSurfaceCard title="Verification failed">
        <Alert type="error" message="This link is invalid or has expired." />
        <p className="text-primary text-sm">
          If you already verified your email address, you can sign in directly.
        </p>
        <ResendVerificationForm prefillEmail={prefillEmail} />
      </CenteredSurfaceCard>
    );
  }

  return (
    <CenteredSurfaceCard title="Email successfully verified">
      <p className="text-primary text-sm">
        Your email address has been verified. You can now sign in to your account.
      </p>
      <LinkButton href="/login" variant="outline" linkAs={Link}>
        Back to login
      </LinkButton>
    </CenteredSurfaceCard>
  );
}
