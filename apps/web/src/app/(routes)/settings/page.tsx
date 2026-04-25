import type { Metadata } from 'next';

import { SettingsForm } from '@/features/preferences/components/SettingsForm';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-32 md:p-6">
      <h1 className="text-primary text-xl font-semibold">Settings</h1>
      <SettingsForm />
    </div>
  );
}
