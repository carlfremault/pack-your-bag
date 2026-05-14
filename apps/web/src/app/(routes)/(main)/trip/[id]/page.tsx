import { Suspense } from 'react';
import { Metadata } from 'next';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { getTrip } from '@/features/trip/api';
import TripDetails from '@/features/trip/components/TripDetails';
import TripDetailsSkeleton from '@/features/trip/components/TripDetailsSkeleton';

export const metadata: Metadata = {
  title: 'Trip details',
  description: 'Manage a trip.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['trips', id],
    queryFn: () => getTrip(id),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Trip details</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<ErrorFallback message="Failed to load trip. Please try again later." />}
        >
          <Suspense fallback={<TripDetailsSkeleton />}>
            <TripDetails id={id} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </div>
  );
}
