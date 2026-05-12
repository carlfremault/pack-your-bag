import { Suspense } from 'react';
import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { getAllTrips } from '@/features/trip/api';
import TripsView from '@/features/trip/components/TripsView';
import TripsViewSkeleton from '@/features/trip/components/TripsViewSkeleton';

export const metadata: Metadata = {
  title: 'Trips',
  description: 'An overview of your trips.',
};

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['trips'],
    queryFn: () => getAllTrips(),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Trips</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<ErrorFallback message="Failed to load trips. Please try again later." />}
        >
          <Suspense fallback={<TripsViewSkeleton />}>
            <TripsView />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </div>
  );
}
