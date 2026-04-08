import type { Metadata } from 'next';

import LoginForm from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your PackYourBag account',
};

export default function Page() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-4 rounded-md border p-4 shadow-sm">
        <h1 className="text-primary text-xl">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
