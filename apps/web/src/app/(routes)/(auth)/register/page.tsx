import type { Metadata } from 'next';

import { CenteredSurfaceCard } from '@repo/react-common/card';

import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a new PackYourBag account',
};

export default function Page() {
  return (
    <CenteredSurfaceCard title="Create an account">
      <RegisterForm />
    </CenteredSurfaceCard>
  );
}
