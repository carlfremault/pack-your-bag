import type { Metadata } from 'next';

import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a new PackYourBag account',
};

export default function Page() {
  return (
    <main className="flex h-full items-center justify-center">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-4 rounded-md border p-4 shadow-sm">
        <h1 className="text-primary text-xl">Create an account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
