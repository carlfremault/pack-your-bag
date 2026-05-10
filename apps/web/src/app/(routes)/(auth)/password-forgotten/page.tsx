import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import PasswordForgottenForm from '@/features/auth/components/PasswordForgottenForm';

export const metadata: Metadata = {
  title: 'Password forgotten',
  description: 'Request a password reset link.',
};

export default function Page() {
  return (
    <CenteredSurfaceCard title="Password forgotten">
      <p className="text-primary text-sm">Enter your email to receive a password reset link.</p>
      <PasswordForgottenForm />
    </CenteredSurfaceCard>
  );
}
