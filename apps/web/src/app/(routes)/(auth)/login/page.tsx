import type { Metadata } from 'next';

import { CenteredSurfaceCard, WelcomeCard } from '@repo/react-common/card';

import GuestExploreButton from '@/features/auth/components/GuestExploreButton';
import LoginForm from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your PackYourBag account',
};

export default function Page() {
  return (
    <div className="flex max-h-full min-h-0 w-full flex-col-reverse items-center gap-4 overflow-y-auto md:w-auto lg:flex-row">
      <WelcomeCard>
        <GuestExploreButton />
      </WelcomeCard>
      <CenteredSurfaceCard title="Sign in">
        <LoginForm />
      </CenteredSurfaceCard>
    </div>
  );
}
