import { headers } from 'next/headers';
import Link from 'next/link';

import PasswordUpdateForm from '@/features/auth/components/PasswordUpdateForm';
import { extractLocaleFromHeaders } from '@/utils/extractLocaleFromHeaders';

import DeleteAccountCard from './DeleteAccountCard';
import LogoutAllDevicesCard from './LogoutAllDevicesCard';
import { PreferencesForm } from './PreferencesForm';

export interface SettingsViewProps {
  error?: string;
  success?: string;
}

export default async function SettingsView(props: SettingsViewProps) {
  const { error, success } = props;
  const locale = extractLocaleFromHeaders(await headers());

  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-4 p-4 md:p-6">
      <h2 className="text-primary text-xl font-semibold">Preferences</h2>
      <PreferencesForm />
      <h2 className="text-primary text-xl font-semibold">Password change</h2>
      <PasswordUpdateForm error={error} success={success} />
      <h2 className="text-primary text-xl font-semibold">Sign out all devices</h2>
      <LogoutAllDevicesCard />
      <h2 className="text-primary text-xl font-semibold">Delete account</h2>
      <DeleteAccountCard locale={locale} />
      <h2 className="text-primary text-xl font-semibold">Legal</h2>
      <div className="bg-surface border-primary-ring flex w-full flex-col gap-6 rounded-md border p-4 shadow-sm transition-opacity disabled:opacity-50">
        <Link href="/policy" className="text-primary text-sm underline">
          Terms &amp; Privacy Notice
        </Link>
      </div>
    </div>
  );
}
