import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Email not verified',
  description: 'Your account is not verified. Please verify your email address to continue.',
};

export default async function Page() {
  const session = await getSession();
  const prefillEmail = session.pendingVerificationEmail;

  return (
    <CenteredSurfaceCard title="Email not verified">
      <p className="text-primary text-sm">
        Your account has not been verified yet. Please check your inbox or spam folder for a
        verification link.
      </p>
      <ResendVerificationForm prefillEmail={prefillEmail} />
    </CenteredSurfaceCard>
  );
}
