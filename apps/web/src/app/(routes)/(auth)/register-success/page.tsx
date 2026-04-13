import { CenteredSurfaceCard } from '@repo/react-common/card';

import type { Metadata } from 'next';

import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Registration successful',
  description:
    'Your account has been created. Your email address needs to be verified before you can sign in.',
};

export default async function Page() {
  const session = await getSession();
  const prefillEmail = session.pendingVerificationEmail;

  return (
    <CenteredSurfaceCard title="Registration successful">
      <p className="text-primary text-sm">
        Your account has been created. Your email address needs to be verified before you can sign
        in. Please check your inbox or spam folder for a verification link.
      </p>
      <ResendVerificationForm prefillEmail={prefillEmail} />
    </CenteredSurfaceCard>
  );
}
