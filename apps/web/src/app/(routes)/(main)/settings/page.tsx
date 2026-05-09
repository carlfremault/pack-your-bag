import { Suspense } from 'react';
import type { Metadata } from 'next';

import { SectionNotReady } from '@repo/react-common/utils';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SettingsErrorFallback } from '@/features/settings/components/SettingsErrorFallback';
import SettingsView from '@/features/settings/components/SettingsView';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="flex min-h-full w-full justify-center pb-32 lg:pb-0">
      <h1 className="sr-only">Settings</h1>
      <ErrorBoundary fallback={<SettingsErrorFallback />}>
        <Suspense fallback={<SectionNotReady />}>
          <SettingsView />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
