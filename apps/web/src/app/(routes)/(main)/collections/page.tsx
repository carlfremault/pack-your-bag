import { Suspense } from 'react';

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';
import { getAllCollections } from '@/features/collection/api';
import CollectionsView from '@/features/collection/components/CollectionsView';
import CollectionsViewSkeleton from '@/features/collection/components/CollectionsViewSkeleton';

export default async function Page() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['collections'],
    queryFn: () => getAllCollections(),
  });

  return (
    <div className="flex w-full justify-center lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">Collections</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary
          fallback={<ErrorFallback message="Failed to load collections. Please try again later." />}
        >
          <Suspense fallback={<CollectionsViewSkeleton />}>
            <CollectionsView />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </div>
  );
}
