import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import LoginForm from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your PackYourBag account',
};

export default function Page() {
  return (
    <CenteredSurfaceCard title="Sign in">
      <LoginForm />
    </CenteredSurfaceCard>
  );
}
