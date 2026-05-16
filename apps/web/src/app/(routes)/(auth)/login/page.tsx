import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import LoginForm from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your PackYourBag account',
};

export default async function Page(props: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await props.searchParams;

  return (
    <CenteredSurfaceCard title="Sign in">
      <LoginForm error={error} />
    </CenteredSurfaceCard>
  );
}
