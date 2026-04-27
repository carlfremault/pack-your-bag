import PasswordUpdateForm from '@/features/auth/components/PasswordUpdateForm';

import LogoutAllDevices from './LogoutAllDevices';
import { PreferencesForm } from './PreferencesForm';

export default function SettingsView() {
  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-4 p-4 md:p-6">
      <h2 className="text-primary text-xl font-semibold">Preferences</h2>
      <PreferencesForm />
      <h2 className="text-primary text-xl font-semibold">Password change</h2>
      <PasswordUpdateForm />
      <h2 className="text-primary text-xl font-semibold">Security & Access</h2>
      <LogoutAllDevices />
    </div>
  );
}
