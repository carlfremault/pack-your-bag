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

export default async function SettingsPage(props: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await props.searchParams;

  return (
    <div className="flex min-h-full w-full justify-center pb-32 lg:pb-0">
      <h1 className="sr-only">Settings</h1>
      <ErrorBoundary
        fallback={<ErrorFallback message="Failed to load preferences. Please try again later." />}
      >
        <Suspense fallback={<SectionNotReady />}>
          <SettingsView error={error} success={success} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
