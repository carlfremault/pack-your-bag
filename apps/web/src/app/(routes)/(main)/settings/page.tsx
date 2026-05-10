import { Suspense } from 'react';
import type { Metadata } from 'next';

import { SectionNotReady } from '@repo/react-common/utils';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import SettingsView from '@/features/settings/components/SettingsView';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your preferences.',
};

export default function SettingsPage() {
  return (
    <div className="flex min-h-full w-full justify-center pb-32 lg:pb-0">
      <h1 className="sr-only">Settings</h1>
      <ErrorBoundary
        fallback={<ErrorFallback message="Failed to load preferences. Please try again later." />}
      >
        <Suspense fallback={<SectionNotReady />}>
          <SettingsView />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
