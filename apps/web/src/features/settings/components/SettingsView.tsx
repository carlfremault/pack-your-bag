import { headers } from 'next/headers';

import PasswordUpdateForm from '@/features/auth/components/PasswordUpdateForm';
import { extractLocaleFromHeaders } from '@/utils/extractLocaleFromHeaders';

import DeleteAccountCard from './DeleteAccountCard';
import LogoutAllDevicesCard from './LogoutAllDevicesCard';
import { PreferencesForm } from './PreferencesForm';

export default async function SettingsView() {
  const locale = extractLocaleFromHeaders(await headers());

  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-4 p-4 md:p-6">
      <h2 className="text-primary text-xl font-semibold">Preferences</h2>
      <PreferencesForm />
      <h2 className="text-primary text-xl font-semibold">Password change</h2>
      <PasswordUpdateForm />
      <h2 className="text-primary text-xl font-semibold">Sign out all devices</h2>
      <LogoutAllDevicesCard />
      <h2 className="text-primary text-xl font-semibold">Delete account</h2>
      <DeleteAccountCard locale={locale} />
    </div>
  );
}
