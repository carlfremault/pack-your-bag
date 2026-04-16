import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import PasswordResetForm from '@/features/auth/components/PasswordResetForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your PackYourBag password',
};

export default function Page() {
  return (
    <CenteredSurfaceCard title="Reset Password">
      <p className="text-primary text-sm">Enter your email to receive a password reset link.</p>
      <PasswordResetForm />
    </CenteredSurfaceCard>
  );
}
