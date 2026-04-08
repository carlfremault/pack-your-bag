import type { Metadata } from 'next';

import PasswordResetForm from '@/features/auth/components/PasswordResetForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your PackYourBag password',
};

export default function Page() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-4 rounded-md border p-4 shadow-sm">
        <h1 className="text-primary text-xl">Reset Password</h1>
        <p className="text-primary text-sm">Enter your email to receive a password reset link.</p>
        <PasswordResetForm />
      </div>
    </div>
  );
}
