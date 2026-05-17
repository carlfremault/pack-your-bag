import { headers } from 'next/headers';
import Link from 'next/link';

import PasswordUpdateForm from '@/features/auth/components/PasswordUpdateForm';
import { getSession } from '@/lib/session';
import { extractLocaleFromHeaders } from '@/utils/extractLocaleFromHeaders';

import DeleteAccountCard from './DeleteAccountCard';
import LogoutAllDevicesCard from './LogoutAllDevicesCard';
import { PreferencesForm } from './PreferencesForm';

export default async function SettingsView() {
  const [locale, session] = await Promise.all([
    headers().then(extractLocaleFromHeaders),
    getSession(),
  ]);
  const isGuest = session.isGuest ?? false;

  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-4 p-4 md:p-6">
      <h2 className="text-primary text-xl font-semibold">Preferences</h2>
      <PreferencesForm />
      <h2 className="text-primary text-xl font-semibold">Password change</h2>
      <PasswordUpdateForm disabled={isGuest} />
      <h2 className="text-primary text-xl font-semibold">Sign out all devices</h2>
      <LogoutAllDevicesCard disabled={isGuest} />
      <h2 className="text-primary text-xl font-semibold">Delete account</h2>
      <DeleteAccountCard locale={locale} disabled={isGuest} />
      <h2 className="text-primary text-xl font-semibold">Legal</h2>
      <div className="bg-surface border-primary-ring flex w-full flex-col gap-6 rounded-md border p-4 shadow-sm transition-opacity disabled:opacity-50">
        <Link href="/policy" className="text-primary text-sm underline">
          Terms &amp; Privacy Notice
        </Link>
      </div>
    </div>
  );
}
