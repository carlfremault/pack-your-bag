import type { Metadata } from 'next';

import { Alert } from '@repo/react-common/alert';
import { CenteredSurfaceCard } from '@repo/react-common/card';

import CancelDeletionForm from '@/features/auth/components/CancelDeletionForm';

export const metadata: Metadata = {
  title: 'Cancel account deletion',
  description: 'Cancel your account deletion request.',
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
        <Alert
          type="error"
          message="Invalid or missing cancellation link. Please use the link from your email or contact support."
        />
      </CenteredSurfaceCard>
    );
  }

  return (
    <CenteredSurfaceCard title="Cancel account deletion">
      <p className="text-primary text-sm">
        Please enter your password to confirm cancellation of your account deletion request.
      </p>
      <CancelDeletionForm token={token} />
    </CenteredSurfaceCard>
  );
}
